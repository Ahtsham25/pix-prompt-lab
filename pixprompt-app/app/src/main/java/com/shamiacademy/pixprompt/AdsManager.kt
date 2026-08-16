package com.shamiacademy.pixprompt

import android.app.Activity
import android.content.Context
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * ============================================================
 * PRODUCTION IDs + TEST-DEVICE MODE
 * ============================================================
 * Your real App ID and real ad unit IDs stay exactly as they are.
 * Instead, THIS SPECIFIC PHONE is registered as a "test device" with
 * Google — so on this phone only, these same real ad unit IDs will
 * serve harmless test ad creatives instead of live ads. Impressions/
 * clicks on this device will NOT count as real traffic, so it's safe
 * to tap around while testing.
 *
 * ⚠️ ONE-TIME SETUP NEEDED — see TEST_DEVICE_IDS below.
 * ============================================================
 */
object AdsManager {

    // Your real banner ad unit ID
    private const val BANNER_AD_UNIT_ID = "ca-app-pub-9508264963334654/1103896314"

    // Your real interstitial ad unit ID
    private const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-9508264963334654/4851569630"

    // Your real Rewarded ad unit ID
    private const val REWARDED_AD_UNIT_ID = "ca-app-pub-9508264963334654/8698801954"

    // TODO: put your device's test ID here once you find it (see instructions).
    // Leave the list empty ( emptyList() ) to run in normal/live mode.
    private val TEST_DEVICE_IDS = listOf(
        "PASTE_YOUR_DEVICE_TEST_ID_HERE"
    )

    private var interstitialAd: InterstitialAd? = null

    // Separate counters so "Copy" and "Back" behave independently and
    // predictably, instead of interfering with each other's count.
    private var copyActionsSinceLastInterstitial = 0
    private const val COPY_INTERSTITIAL_FREQUENCY = 2 // 1st copy: no ad, 2nd copy: ad, then repeats

    private var backActionsSinceLastInterstitial = 0
    private const val BACK_INTERSTITIAL_FREQUENCY = 3

    private var rewardedAd: RewardedAd? = null

    fun init(context: Context) {
        val configuration = RequestConfiguration.Builder()
            .setTestDeviceIds(TEST_DEVICE_IDS)
            .build()
        MobileAds.setRequestConfiguration(configuration)

        MobileAds.initialize(context) {}
        preloadInterstitial(context)
        preloadRewarded(context)
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

    /**
     * Shows an interstitial for the "Copy" action, every 2nd copy (1st copy:
     * no ad, 2nd copy: ad, then repeats) — counted across all prompts, not
     * reset when the user navigates back and copies a different image.
     */
    fun maybeShowInterstitialForCopy(activity: Activity, onComplete: () -> Unit = {}) {
        copyActionsSinceLastInterstitial++
        if (copyActionsSinceLastInterstitial < COPY_INTERSTITIAL_FREQUENCY) {
            onComplete()
            return
        }
        copyActionsSinceLastInterstitial = 0
        showInterstitialIfLoaded(activity, onComplete)
    }

    /** Shows an interstitial for the "Back" action, every Nth time (own counter). */
    fun maybeShowInterstitial(activity: Activity, onComplete: () -> Unit = {}) {
        backActionsSinceLastInterstitial++
        if (backActionsSinceLastInterstitial < BACK_INTERSTITIAL_FREQUENCY) {
            onComplete()
            return
        }
        backActionsSinceLastInterstitial = 0
        showInterstitialIfLoaded(activity, onComplete)
    }

    private fun showInterstitialIfLoaded(activity: Activity, onComplete: () -> Unit) {
        val ad = interstitialAd
        if (ad == null) {
            preloadInterstitial(activity)
            onComplete()
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity)
                onComplete()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                preloadInterstitial(activity)
                onComplete()
            }
        }
        ad.show(activity)
    }

    /**
     * Always shows an interstitial (no frequency gate) — used for the "tap
     * on image" trigger. [onComplete] runs once the ad is dismissed (or
     * immediately if no ad was available) — put your navigation there.
     */
    fun showInterstitialAlways(activity: Activity, onComplete: () -> Unit = {}) {
        val ad = interstitialAd
        if (ad == null) {
            preloadInterstitial(activity)
            onComplete()
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity)
                onComplete()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                preloadInterstitial(activity)
                onComplete()
            }
        }
        ad.show(activity)
    }

    private fun preloadRewarded(context: Context) {
        RewardedAd.load(
            context,
            REWARDED_AD_UNIT_ID,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    /**
     * Shows a rewarded ad. [onReward] is called only if the user watches it
     * fully and earns the reward. [onUnavailable] is called if no ad is
     * ready yet (also triggers a fresh preload for next time).
     */
    fun showRewardedAd(activity: Activity, onReward: () -> Unit, onUnavailable: () -> Unit) {
        val ad = rewardedAd
        if (ad == null) {
            preloadRewarded(activity)
            onUnavailable()
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                preloadRewarded(activity)
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                rewardedAd = null
                preloadRewarded(activity)
            }
        }

        ad.show(activity) { onReward() }
    }
}
