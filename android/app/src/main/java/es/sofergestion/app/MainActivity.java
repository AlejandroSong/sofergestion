package es.sofergestion.app;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        installWebViewGuards();
        handler.postDelayed(this::installWebViewGuards, 250);
        handler.postDelayed(this::installWebViewGuards, 1200);
    }

    @Override
    public void onStart() {
        super.onStart();
        installWebViewGuards();
    }

    @Override
    public void onResume() {
        super.onResume();
        installWebViewGuards();
    }

    private void installWebViewGuards() {
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        webView.getSettings().setSupportMultipleWindows(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(view, request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url == null ? null : Uri.parse(url));
            }

            private boolean handleUrl(WebView view, Uri uri) {
                if (uri == null) {
                    return true;
                }
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
                if (scheme.equals("intent")
                    || scheme.equals("market")
                    || scheme.equals("android-app")
                    || scheme.equals("googlechrome")
                    || scheme.equals("googlechromes")) {
                    String fallback = uri.getQueryParameter("browser_fallback_url");
                    if (fallback != null && keepInside(Uri.parse(fallback))) {
                        view.loadUrl(fallback);
                    }
                    return true;
                }
                return !keepInside(uri);
            }
        });
    }

    private static boolean keepInside(Uri uri) {
        String host = uri.getHost();
        if (host == null) {
            return false;
        }
        host = host.toLowerCase();
        return host.equals("localhost")
            || host.equals("www.sofergestion.es")
            || host.equals("sofergestion.es")
            || host.endsWith(".supabase.co")
            || host.equals("accounts.google.com")
            || host.endsWith(".google.com")
            || host.endsWith(".google.es")
            || host.endsWith(".gstatic.com")
            || host.endsWith(".googleusercontent.com")
            || host.contains("youtube.com");
    }
}
