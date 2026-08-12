package com.shamiacademy.pixprompt

import android.app.Activity
import android.content.Context
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

/**
 * Central place for AdMob setup.
 *
 * IMPORTANT: The ad unit IDs below are Google's official TEST ids.
 * They are safe to build and test with, but you MUST replace them with
 * your own real ad unit IDs from https://apps.admob.com before publishing,
 * otherwise your AdMob account can get suspended for invalid traffic.
 *
 *   1. Create an app in AdMob -> get your App ID -> put it in AndroidManifest.xml
 *      (com.google.android.gms.ads.APPLICATION_ID meta-data)
 *   2. Create Banner + Interstitial ad units -> paste their IDs below.
 */
object AdsManager {

    // TODO: replace with your real banner ad unit ID
    private const val BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/9214589741"

    // TODO: replace with your real interstitial ad unit ID
    private const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712"

    private var interstitialAd: InterstitialAd? = null
    private var actionsSinceLastInterstitial = 0
    private const val INTERSTITIAL_FREQUENCY = 4 // show after every N "copy" actions

    fun init(context: Context) {
        MobileAds.initialize(context) {}
        preloadInterstitial(context)
    }

    fun loadBanner(activity: Activity, container: FrameLayout) {
        val adView = AdView(activity)
        adView.adUnitId = BANNER_AD_UNIT_ID
        adView.setAdSize(AdSize.BANNER)
        container.removeAllViews()
        container.addView(adView)
        adView.loadAd(AdRequest.Builder().build())
    }

    private fun preloadInterstitial(context: Context) {
        InterstitialAd.load(
            context,
            INTERSTITIAL_AD_UNIT_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: com.google.android.gms.ads.LoadAdError) {
                    interstitialAd = null
                }
            }
        )
    }

    /** Call this after actions like "copy prompt". Shows an interstitial every few actions. */
    fun maybeShowInterstitial(activity: Activity) {
        actionsSinceLastInterstitial++
        if (actionsSinceLastInterstitial < INTERSTITIAL_FREQUENCY) return
        actionsSinceLastInterstitial = 0

        val ad = interstitialAd
        if (ad == null) {
            preloadInterstitial(activity)
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity)
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                preloadInterstitial(activity)
            }
        }
        ad.show(activity)
    }
}
