from django.urls import path
from .views import MeView, UserStatsView

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("me/stats/", UserStatsView.as_view(), name="user-stats"),
]
