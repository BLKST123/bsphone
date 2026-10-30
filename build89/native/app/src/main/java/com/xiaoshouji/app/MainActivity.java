package com.xiaoshouji.app;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceResponse;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 7302;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7303;
    private static final String MESSAGE_CHANNEL = "bsphone_messages";

    private WebView webView;
    private NativeHttp nativeHttp;
    private ValueCallback<Uri[]> filePathCallback;
    private boolean appVisible = true;
    private boolean immersive = true;
    private volatile int keyboardHeight = 0;
    private final Map<String, NativeRequest> nativeRequests = new ConcurrentHashMap<>();
    private final AtomicLong nativeRequestSequence = new AtomicLong();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        applyImmersive(true);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFFFFFFFF);
        setContentView(webView);
        webView.getViewTreeObserver().addOnGlobalLayoutListener(this::updateKeyboardHeight);
        webView.post(this::updateKeyboardHeight);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setTextZoom(100);
        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (debuggable) WebView.setWebContentsDebuggingEnabled(true);

        nativeHttp = new NativeHttp();
        webView.addJavascriptInterface(nativeHttp, "NativeHttp");
        webView.addJavascriptInterface(new NativeExport(), "NativeExport");
        webView.addJavascriptInterface(new NativeDisplay(), "NativeDisplay");
        webView.addJavascriptInterface(new NativeNotifications(), "NativeNotifications");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("localhost".equals(uri.getHost()) && "GET".equalsIgnoreCase(request.getMethod())) {
                    return assetResponse(uri.getPath());
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if (scheme.equals("file") || scheme.equals("about") || scheme.equals("blob") || scheme.equals("data")
                        || "localhost".equals(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                if (params != null && params.getAcceptTypes() != null && params.getAcceptTypes().length > 0) {
                    String[] accept = params.getAcceptTypes();
                    if (accept.length == 1 && accept[0] != null && !accept[0].trim().isEmpty()) {
                        intent.setType(accept[0]);
                    }
                }
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(intent, "选择文件"), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception error) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "无法打开文件选择器", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.loadUrl("https://localhost/index.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        appVisible = true;
        if (immersive) applyImmersive(true);
    }

    @Override
    protected void onPause() {
        appVisible = false;
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (nativeHttp != null) nativeHttp.cancelAll();
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersive) applyImmersive(true);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        moveTaskToBack(true);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) results[i] = data.getClipData().getItemAt(i).getUri();
                    } else if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != NOTIFICATION_PERMISSION_REQUEST || webView == null) return;
        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        webView.post(() -> webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('nativepermissionchange',{detail:" + granted + "}));", null));
    }

    private void applyImmersive(boolean enabled) {
        immersive = enabled;
        runOnUiThread(() -> {
            View decor = getWindow().getDecorView();
            if (enabled) {
                decor.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            } else {
                decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }
        });
    }

    private void updateKeyboardHeight() {
        WebView view = webView;
        if (view == null) return;
        int pixels = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsets insets = view.getRootWindowInsets();
            if (insets != null) pixels = insets.getInsets(WindowInsets.Type.ime()).bottom;
        } else {
            Rect visible = new Rect();
            view.getWindowVisibleDisplayFrame(visible);
            pixels = Math.max(0, view.getRootView().getHeight() - visible.bottom);
        }
        float density = getResources().getDisplayMetrics().density;
        int cssHeight = density > 0 ? Math.round(pixels / density) : 0;
        if (cssHeight < 80) cssHeight = 0;
        if (cssHeight == keyboardHeight) return;
        keyboardHeight = cssHeight;
        view.post(() -> {
            if (webView != null) webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('nativekeyboardchange',{detail:" + keyboardHeight + "}));", null);
        });
    }

    private WebResourceResponse assetResponse(String requestPath) {
        String path = requestPath == null || requestPath.isEmpty() ? "/index.html" : requestPath;
        if (path.equals("/")) path = "/index.html";
        if (path.contains("..")) return new WebResourceResponse(
                "text/plain", "UTF-8", 403, "Forbidden", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
        String assetPath = "public" + path;
        try {
            String extension = MimeTypeMap.getFileExtensionFromUrl(path);
            String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            if (mime == null || mime.isEmpty()) mime = "application/octet-stream";
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            headers.put("Access-Control-Allow-Origin", "*");
            return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, getAssets().open(assetPath));
        } catch (Exception error) {
            return new WebResourceResponse(
                    "text/plain", "UTF-8", 404, "Not Found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
        }
    }

    private static class NativeRequest {
        volatile boolean cancelled;
        volatile HttpURLConnection connection;
    }

    private class NativeHttp {
        @JavascriptInterface
        public String request(String method, String endpoint, String apiKey, String body) {
            String requestId = "nh_" + System.currentTimeMillis() + "_" + nativeRequestSequence.incrementAndGet();
            NativeRequest request = new NativeRequest();
            nativeRequests.put(requestId, request);
            Thread worker = new Thread(
                    () -> executeNativeRequest(requestId, request, method, endpoint, apiKey, body),
                    "bs-native-http-" + requestId);
            worker.setDaemon(true);
            worker.start();
            return requestId;
        }

        @JavascriptInterface
        public boolean cancel(String requestId) {
            if (requestId == null) return false;
            NativeRequest request = nativeRequests.remove(requestId);
            if (request == null) return false;
            request.cancelled = true;
            HttpURLConnection connection = request.connection;
            if (connection != null) {
                try { connection.disconnect(); } catch (Exception ignored) {}
            }
            return true;
        }

        public void cancelAll() {
            for (String requestId : nativeRequests.keySet()) cancel(requestId);
        }

        private void executeNativeRequest(
                String requestId, NativeRequest request, String method, String endpoint, String apiKey, String body) {
            JSONObject result = new JSONObject();
            HttpURLConnection connection = null;
            try {
                URL url = new URL(endpoint);
                connection = (HttpURLConnection) url.openConnection();
                request.connection = connection;
                if (request.cancelled) {
                    connection.disconnect();
                    return;
                }
                connection.setRequestMethod(method == null || method.isEmpty() ? "GET" : method.toUpperCase());
                connection.setConnectTimeout(60000);
                connection.setReadTimeout(180000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept", "application/json, text/event-stream, */*");
                connection.setRequestProperty("User-Agent", "BSPhone/3.78 Android");
                if (apiKey != null && !apiKey.isEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer " + apiKey);
                }
                boolean hasBody = body != null && !body.isEmpty();
                if (hasBody) {
                    connection.setDoOutput(true);
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                    connection.setFixedLengthStreamingMode(bytes.length);
                    try (OutputStream output = connection.getOutputStream()) {
                        output.write(bytes);
                    }
                }
                if (request.cancelled) {
                    connection.disconnect();
                    return;
                }
                int status = connection.getResponseCode();
                InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                String text = stream == null ? "" : readUtf8(stream);
                String contentType = connection.getHeaderField("Content-Type");
                result.put("ok", status >= 200 && status < 300);
                result.put("status", status);
                result.put("body", text);
                result.put("contentType", contentType == null ? "" : contentType);
            } catch (Exception error) {
                String message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
                try {
                    result.put("ok", false);
                    result.put("status", 0);
                    result.put("body", message);
                    result.put("contentType", "");
                } catch (Exception ignored) {
                }
            } finally {
                if (connection != null) connection.disconnect();
                nativeRequests.remove(requestId);
            }
            if (!request.cancelled) emitNativeHttpResult(requestId, result);
        }
    }

    private void emitNativeHttpResult(String requestId, JSONObject result) {
        WebView view = webView;
        if (view == null) return;
        String script = "window.BSNativeHttp&&window.BSNativeHttp.resolve("
                + JSONObject.quote(requestId) + "," + JSONObject.quote(result.toString()) + ");";
        view.post(() -> {
            if (webView != null) webView.evaluateJavascript(script, null);
        });
    }

    private String readUtf8(InputStream input) throws Exception {
        try (InputStream stream = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = stream.read(buffer)) >= 0) output.write(buffer, 0, count);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private class NativeExport {
        @JavascriptInterface
        public String saveFile(String name, String mime, String text) {
            try {
                String safe = String.valueOf(name == null ? "BS小手机备份.txt" : name)
                        .replace('/', '_').replace('\\', '_');
                File root = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (root == null) root = getFilesDir();
                File dir = new File(root, "BS小手机");
                if (!dir.exists() && !dir.mkdirs()) return "ERROR:无法创建导出目录";
                File file = new File(dir, safe);
                try (FileOutputStream output = new FileOutputStream(file)) {
                    output.write(String.valueOf(text == null ? "" : text).getBytes(StandardCharsets.UTF_8));
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "已导出到 " + file.getAbsolutePath(), Toast.LENGTH_LONG).show());
                return file.getAbsolutePath();
            } catch (Exception error) {
                return "ERROR:" + (error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
            }
        }
    }

    private class NativeDisplay {
        @JavascriptInterface
        public int getKeyboardHeight() {
            return keyboardHeight;
        }

        @JavascriptInterface
        public void setFullscreen(boolean enabled) {
            applyImmersive(enabled);
        }
    }

    private class NativeNotifications {
        @JavascriptInterface
        public boolean hasPermission() {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                    || checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public boolean isAppVisible() {
            return appVisible;
        }

        @JavascriptInterface
        public boolean requestPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasPermission()) {
                runOnUiThread(() -> requestPermissions(
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST));
            }
            return true;
        }

        @JavascriptInterface
        public boolean enableBackground() {
            try {
                Intent service = new Intent(MainActivity.this, MessageKeepAliveService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(service);
                else startService(service);
                return true;
            } catch (Exception error) {
                return false;
            }
        }

        @JavascriptInterface
        public void disableBackground() {
            stopService(new Intent(MainActivity.this, MessageKeepAliveService.class));
        }

        @JavascriptInterface
        public void cancel(String tag) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null && tag != null) manager.cancel(tag, 7304);
        }

        @JavascriptInterface
        public void notify(String title, String body, String tag) {
            if (!hasPermission()) return;
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        MESSAGE_CHANNEL, "角色消息", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("角色消息与订单状态提醒");
                manager.createNotificationChannel(channel);
            }
            Intent open = new Intent(MainActivity.this, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(
                    MainActivity.this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(MainActivity.this, MESSAGE_CHANNEL)
                    : new Notification.Builder(MainActivity.this);
            builder.setSmallIcon(android.R.drawable.stat_notify_chat)
                    .setContentTitle(title == null ? "BS小手机" : title)
                    .setContentText(body == null ? "" : body)
                    .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
                    .setAutoCancel(true)
                    .setContentIntent(pending)
                    .setPriority(Notification.PRIORITY_HIGH);
            int id = tag == null ? 7304 : Math.abs(tag.hashCode());
            manager.notify(tag == null ? "bsphone_message" : tag, id, builder.build());
        }
    }
}
