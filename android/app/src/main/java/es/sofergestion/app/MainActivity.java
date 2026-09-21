package es.sofergestion.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * No sustituimos el WebViewClient de Capacitor.
 * Un shouldOverrideUrlLoading propio corta el POST de Google (password) y
 * traga el deep link es.sofergestion.app://google-callback.
 * El OAuth va por Custom Tabs ({@code Browser.open}), no por este WebView.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        allowThirdPartyCookies();
    }

    @Override
    public void onStart() {
        super.onStart();
        allowThirdPartyCookies();
    }

    private void allowThirdPartyCookies() {
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
    }
}
