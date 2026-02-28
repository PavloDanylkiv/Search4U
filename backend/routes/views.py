from rest_framework import generics, permissions
from .filters import RouteFilter
from .models import Route, RoutePoint, UserRoute, Rating
from .serializers import (
    RouteDetailSerializer,
    RouteListSerializer,
    RoutePointSerializer,
    UserRouteSerializer,
    RatingSerializer,
)


# ── Routes ────────────────────────────────────────────────────────────────────

class RouteListView(generics.ListAPIView):
    """
    GET /api/routes/
    Filters: city, mood, budget_max__lte, budget_min__gte, duration__lte
    Search:  ?search=...
    Order:   ?ordering=avg_rating
    """
    queryset = Route.objects.prefetch_related("images", "user_routes", "points")
    serializer_class = RouteListSerializer
    filterset_class = RouteFilter
    search_fields = ("name", "city", "description")
    ordering_fields = ("avg_rating", "estimated_duration", "budget_max", "created_at")
    ordering = ("-created_at",)


class RouteDetailView(generics.RetrieveAPIView):
    """GET /api/routes/<id>/"""
    queryset = Route.objects.prefetch_related("images", "points", "ratings", "user_routes")
    serializer_class = RouteDetailSerializer


class RoutePointListView(generics.ListAPIView):
    """GET /api/routes/<route_pk>/points/"""
    serializer_class = RoutePointSerializer

    def get_queryset(self):
        return RoutePoint.objects.filter(route_id=self.kwargs["route_pk"])


# ── User Routes (saved / history) ─────────────────────────────────────────────

class UserRouteListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/user/routes/   — список збережених маршрутів
    POST /api/user/routes/   — зберегти маршрут
    Query params: status, is_favorite
    """
    serializer_class = UserRouteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = UserRoute.objects.filter(user=self.request.user).select_related("route")
        status_filter = self.request.query_params.get("status")
        is_favorite = self.request.query_params.get("is_favorite")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if is_favorite is not None:
            qs = qs.filter(is_favorite=is_favorite.lower() == "true")
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserRouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/user/routes/<id>/
    PATCH  /api/user/routes/<id>/   — оновити статус, коментар, is_favorite
    DELETE /api/user/routes/<id>/   — прибрати зі збережених
    """
    serializer_class = UserRouteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserRoute.objects.filter(user=self.request.user)


# ── Ratings ───────────────────────────────────────────────────────────────────

class RatingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/routes/<route_pk>/ratings/
    POST /api/routes/<route_pk>/ratings/   — оцінити маршрут
    """
    serializer_class = RatingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Rating.objects.filter(route_id=self.kwargs["route_pk"]).select_related("user")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["route"] = generics.get_object_or_404(Route, pk=self.kwargs["route_pk"])
        return ctx


class RatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PUT    /api/routes/<route_pk>/ratings/<id>/
    DELETE /api/routes/<route_pk>/ratings/<id>/
    """
    serializer_class = RatingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Rating.objects.filter(
            route_id=self.kwargs["route_pk"], user=self.request.user
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["route"] = generics.get_object_or_404(Route, pk=self.kwargs["route_pk"])
        return ctx
