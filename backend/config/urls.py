from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from routes.urls import routes_urlpatterns, user_routes_urlpatterns
from users.google_auth import GoogleLoginView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth (register, login, logout, token refresh, social)
    path("api/auth/", include("dj_rest_auth.urls")),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/auth/social/", include("allauth.socialaccount.urls")),

    # Google OAuth (ID token → JWT)
    path("api/auth/google/", GoogleLoginView.as_view(), name="google-login"),

    # User profile & stats
    path("api/users/", include("users.urls")),

    # Routes
    path("api/routes/", include(routes_urlpatterns)),

    # User saved routes
    path("api/user/routes/", include(user_routes_urlpatterns)),

    # Weather
    path("api/weather/", include("weather.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
