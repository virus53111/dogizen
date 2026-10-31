package com.murdilimax.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final String HOME = "https://murdilimax.com/mobile/";
    private static final int SAVE_JSON = 9071;
    private WebView web;
    private String pendingExport;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff7050ef);
        getWindow().setNavigationBarColor(0xfff8f7ff);
        web = new WebView(this);
        web.setBackgroundColor(0xfff8f7ff);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new SafeBridge(), "MurdilimaxAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!request.isForMainFrame()) return false;
                if (isMobileUrl(uri)) return false;
                openExternalUri(uri);
                return true;
            }
        });
        setContentView(web);
        web.loadUrl(HOME);
    }

    private boolean isMobileUrl(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme())
            && "murdilimax.com".equalsIgnoreCase(uri.getHost())
            && uri.getPath() != null
            && (uri.getPath().equals("/mobile") || uri.getPath().startsWith("/mobile/"));
    }

    private void openExternalUri(Uri uri) {
        if (uri == null) return;
        String scheme = uri.getScheme();
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception ignored) { /* no browser installed */ }
    }

    private final class SafeBridge {
        @JavascriptInterface public void openExternal(String value) {
            if (value == null || value.length() > 1800) return;
            final Uri uri = Uri.parse(value);
            runOnUiThread(() -> openExternalUri(uri));
        }
        @JavascriptInterface public void saveJson(String data) {
            if (data == null || data.length() > 1024 * 1024) return;
            // File creation is confirmed by the user in Android's system picker.
            runOnUiThread(() -> {
                pendingExport = data;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "murdilimax-mobile-profiles.json");
                startActivityForResult(intent, SAVE_JSON);
            });
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SAVE_JSON) {
            String contents = pendingExport;
            pendingExport = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && contents != null) {
                try (OutputStream stream = getContentResolver().openOutputStream(data.getData())) {
                    if (stream != null) stream.write(contents.getBytes(StandardCharsets.UTF_8));
                } catch (Exception ignored) {
                    android.widget.Toast.makeText(this, "Ошибка сохранения файла", android.widget.Toast.LENGTH_LONG).show();
                }
            }
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (web != null) { web.removeJavascriptInterface("MurdilimaxAndroid");web.destroy();web=null; }
        super.onDestroy();
    }
}