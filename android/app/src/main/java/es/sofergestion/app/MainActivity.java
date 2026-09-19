package es.sofergestion.app;

import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
    }
}
