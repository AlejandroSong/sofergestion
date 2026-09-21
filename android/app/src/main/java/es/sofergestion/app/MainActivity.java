package es.sofergestion.app;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private boolean guardsInstalled = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        installWebViewGuards();
    }

    @Override
    public void onStart() {
        super.onStart();
        installWebViewGuards();
    }

    private void installWebViewGuards() {
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        String ua = settings.getUserAgentString();
        if (ua != null && ua.contains("; wv")) {
            settings.setUserAgentString(ua.replace("; wv", ""));
        }
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
        if (guardsInstalled) {
            return;
        }
        guardsInstalled = true;
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && "POST".equalsIgnoreCase(request.getMethod())) {
                    return false;
                }
                return handleUrl(view, request == null ? null : request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url == null ? null : Uri.parse(url));
            }

            private boolean handleUrl(WebView view, Uri uri) {
                if (uri == null) {
                    return false;
                }
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
                if (scheme.isEmpty() || scheme.equals("about") || scheme.equals("data") || scheme.equals("blob")) {
                    return false;
                }
                if (scheme.equals("intent")
                    || scheme.equals("market")
                    || scheme.equals("android-app")
                    || scheme.equals("googlechrome")
                    || scheme.equals("googlechromes")) {
                    String fallback = intentFallback(uri);
                    if (fallback != null && keepInside(Uri.parse(fallback))) {
                        view.loadUrl(fallback);
                    }
                    return true;
                }
                if (scheme.equals("https") || scheme.equals("http")) {
                    return !keepInside(uri);
                }
                return true;
            }
        });
    }

    private static String intentFallback(Uri uri) {
        String fromQuery = uri.getQueryParameter("browser_fallback_url");
        if (fromQuery != null && !fromQuery.isEmpty()) {
            return fromQuery;
        }
        String raw = uri.toString();
        String marker = "S.browser_fallback_url=";
        int idx = raw.indexOf(marker);
        if (idx >= 0) {
            String rest = raw.substring(idx + marker.length());
            int end = rest.indexOf(';');
            if (end < 0) {
                end = rest.length();
            }
            try {
                return URLDecoder.decode(rest.substring(0, end), StandardCharsets.UTF_8.name());
            } catch (Exception ignored) {
                return rest.substring(0, end);
            }
        }
        if (uri.getHost() != null && raw.contains("scheme=https")) {
            String path = uri.getEncodedPath() == null ? "" : uri.getEncodedPath();
            String query = uri.getEncodedQuery() == null ? "" : "?" + uri.getEncodedQuery();
            return "https://" + uri.getHost() + path + query;
        }
        return null;
    }

    private static boolean keepInside(Uri uri) {
        String host = uri.getHost();
        if (host == null) {
            return false;
        }
        host = host.toLowerCase();
        return host.equals("localhost")
            || host.equals("127.0.0.1")
            || host.equals("www.sofergestion.es")
            || host.equals("sofergestion.es")
            || host.endsWith(".supabase.co")
            || host.equals("google.com")
            || host.equals("g.co")
            || host.equals("recaptcha.net")
            || host.endsWith(".recaptcha.net")
            || host.equals("googleapis.com")
            || host.endsWith(".googleapis.com")
            || host.equals("gstatic.com")
            || host.endsWith(".gstatic.com")
            || host.equals("googleusercontent.com")
            || host.endsWith(".googleusercontent.com")
            || host.equals("accounts.google.com")
            || host.endsWith(".google.com")
            || host.endsWith(".google.es")
            || host.contains("youtube.com");
    }
}
