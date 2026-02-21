from django.urls import path
from .views import (
    RouteListView,
    RouteDetailView,
    RoutePointListView,
    UserRouteListCreateView,
    UserRouteDetailView,
    RatingListCreateView,
    RatingDetailView,
)

routes_urlpatterns = [
    path("", RouteListView.as_view(), name="route-list"),
    path("<int:pk>/", RouteDetailView.as_view(), name="route-detail"),
    path("<int:route_pk>/points/", RoutePointListView.as_view(), name="route-points"),
    path("<int:route_pk>/ratings/", RatingListCreateView.as_view(), name="route-ratings"),
    path(
        "<int:route_pk>/ratings/<int:pk>/",
        RatingDetailView.as_view(),
        name="route-rating-detail",
    ),
]

user_routes_urlpatterns = [
    path("", UserRouteListCreateView.as_view(), name="user-route-list"),
    path("<int:pk>/", UserRouteDetailView.as_view(), name="user-route-detail"),
]
