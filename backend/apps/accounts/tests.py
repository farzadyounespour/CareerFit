from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.authtoken.models import Token

from .models import UserProfile


class AccountApiTests(APITestCase):
    def test_register_login_and_me(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Student User",
                "email": "student@example.com",
                "password": "careerfit-pass",
                "target_role": "Data Analyst",
            },
            format="json",
        )

        self.assertEqual(register_response.status_code, 201)
        token = register_response.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        me_response = self.client.get("/api/accounts/me/")

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["user"]["target_role"], "Data Analyst")

        update_response = self.client.patch(
            "/api/accounts/me/",
            {
                "phone": "+1 514 555 1212",
                "location": "Montreal, QC",
                "work_preference": "Hybrid preferred",
                "summary": "Data analyst with reporting experience.",
            },
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["user"]["location"], "Montreal, QC")
        self.assertEqual(update_response.data["user"]["work_preference"], "Hybrid preferred")

    def test_registration_rejects_common_password(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Student User",
                "email": "student@example.com",
                "password": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_signed_in_user_can_delete_account(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Delete User",
                "email": "delete@example.com",
                "password": "careerfit-pass",
            },
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {register_response.data['token']}")

        response = self.client.delete("/api/accounts/me/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(username="delete@example.com").exists())

    def test_signed_in_user_can_download_workspace_data(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Export User",
                "email": "export@example.com",
                "password": "careerfit-pass",
            },
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {register_response.data['token']}")

        response = self.client.get("/api/accounts/me/export/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profile"]["email"], "export@example.com")
        self.assertIn("applications", response.json())

    @override_settings(DEBUG=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_password_reset_updates_password_and_invalidates_tokens(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Reset User",
                "email": "reset@example.com",
                "password": "careerfit-pass",
            },
            format="json",
        )
        reset_response = self.client.post(
            "/api/accounts/password-reset/",
            {"email": "reset@example.com"},
            format="json",
        )
        reset_url = reset_response.data["reset_url"]
        query = reset_url.split("?", 1)[1]
        params = dict(part.split("=", 1) for part in query.split("&"))
        confirm_response = self.client.post(
            "/api/accounts/password-reset-confirm/",
            {
                "uid": params["reset_uid"],
                "token": params["reset_token"],
                "password": "new-careerfit-pass",
            },
            format="json",
        )
        login_response = self.client.post(
            "/api/accounts/login/",
            {"email": "reset@example.com", "password": "new-careerfit-pass"},
            format="json",
        )

        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(login_response.status_code, 200)
        self.assertNotEqual(login_response.data["token"], register_response.data["token"])

    @override_settings(DEBUG=True, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_verification_marks_profile_verified(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Verify User",
                "email": "verify@example.com",
                "password": "careerfit-pass",
            },
            format="json",
        )
        verification_url = register_response.data["verification_url"]
        query = verification_url.split("?", 1)[1]
        params = dict(part.split("=", 1) for part in query.split("&"))
        response = self.client.post(
            "/api/accounts/verify-email/",
            {"uid": params["verify_uid"], "token": params["verify_token"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(UserProfile.objects.get(user__username="verify@example.com").email_verified)

    @override_settings(CAREERFIT_TOKEN_TTL_HOURS=-1)
    def test_expired_token_is_rejected(self):
        user = User.objects.create_user(username="expired@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get("/api/accounts/me/")

        self.assertEqual(response.status_code, 401)
