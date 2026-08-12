package com.shamiacademy.pixprompt

import android.app.Activity
import android.widget.Toast
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

/**
 * Wraps Google's User Messaging Platform (UMP) SDK so the "Manage Ad
 * Consent" menu item can re-open the GDPR/consent form for users in
 * regions where it's required (mainly EEA/UK). Outside those regions it
 * simply tells the user it's not needed.
 */
object ConsentManager {

    fun requestConsentInfoUpdate(activity: Activity) {
        val params = ConsentRequestParameters.Builder().build()
        val consentInformation = UserMessagingPlatform.getConsentInformation(activity)
        consentInformation.requestConsentInfoUpdate(activity, params, {
            // success — nothing to do, form (if any) will be offered via the menu
        }, {
            // failure — ignore, ads still load with default (non-personalized) settings
        })
    }

    fun showPrivacyOptionsForm(activity: Activity) {
        val consentInformation = UserMessagingPlatform.getConsentInformation(activity)
        if (consentInformation.privacyOptionsRequirementStatus ==
            ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
        ) {
            UserMessagingPlatform.showPrivacyOptionsForm(activity) { }
        } else {
            Toast.makeText(
                activity,
                "Ad consent settings aren't required for your region.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }
}
