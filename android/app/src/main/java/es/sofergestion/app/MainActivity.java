package es.sofergestion.app;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        lockWebViewToSingleWindow();
        keepGoogleInsideWebView();
    }

    @Override
    public void onStart() {
        super.onStart();
        lockWebViewToSingleWindow();
    }

    private void lockWebViewToSingleWindow() {
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        webView.getSettings().setSupportMultipleWindows(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
    }

    private void keepGoogleInsideWebView() {
        if (this.bridge == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        if (webView == null) {
            return;
        }
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) {
                    return super.shouldOverrideUrlLoading(view, request);
                }
                String scheme = uri.getScheme() != null ? uri.getScheme() : "";
                if (scheme.equals("intent") || scheme.equals("market") || scheme.equals("android-app")) {
                    return true;
                }
                if (isGoogleAuthUrl(uri)) {
                    return false;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    private static boolean isGoogleAuthUrl(Uri uri) {
        if (uri == null || uri.getHost() == null) {
            return false;
        }
        String host = uri.getHost();
        return host.equals("accounts.google.com")
            || host.endsWith(".google.com")
            || host.endsWith(".google.es")
            || host.endsWith(".gstatic.com")
            || host.endsWith(".googleusercontent.com")
            || host.contains("youtube.com");
    }
}
