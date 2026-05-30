from rest_framework.test import APITestCase


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
