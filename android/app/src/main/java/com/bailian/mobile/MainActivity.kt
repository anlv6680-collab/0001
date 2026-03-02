package com.bailian.mobile

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        val initialUrl = resolveWebAppUrl()
        if (shouldPromptForUrl(initialUrl)) {
            promptForWebAppUrl(initialUrl)
        } else {
            webView.loadUrl(initialUrl)
        }
    }

    private fun resolveWebAppUrl(): String {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val saved = prefs.getString(PREF_WEB_APP_URL, null)?.trim().orEmpty()
        if (saved.isNotEmpty()) return saved
        return BuildConfig.WEB_APP_URL.trim()
    }

    private fun shouldPromptForUrl(url: String): Boolean {
        if (url.isBlank()) return true
        return url.contains("your-domain.example.com")
    }

    private fun promptForWebAppUrl(defaultValue: String) {
        val input = EditText(this)
        input.hint = "https://your-domain.com"
        input.setText(defaultValue)

        AlertDialog.Builder(this)
            .setTitle("配置服务地址")
            .setMessage("请输入你部署后的 Web 地址（建议 HTTPS）")
            .setView(input)
            .setCancelable(false)
            .setPositiveButton("保存并打开") { _, _ ->
                val candidate = input.text.toString().trim()
                val finalUrl = normalizeUrl(candidate)
                if (finalUrl.isNotEmpty()) {
                    getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                        .edit()
                        .putString(PREF_WEB_APP_URL, finalUrl)
                        .apply()
                    webView.loadUrl(finalUrl)
                } else {
                    webView.loadData(
                        "<h3>请重新打开应用并输入有效的 http/https 地址。</h3>",
                        "text/html; charset=utf-8",
                        "utf-8"
                    )
                }
            }
            .show()
    }

    private fun normalizeUrl(raw: String): String {
        if (raw.isBlank()) return ""
        if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
        return "https://$raw"
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    companion object {
        private const val PREFS_NAME = "bailian_mobile"
        private const val PREF_WEB_APP_URL = "web_app_url"
    }
}
