from decimal import Decimal
from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, UserStatsSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserStatsView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserStatsSerializer

    def get(self, request):
        from routes.models import UserRoute

        user_routes = UserRoute.objects.filter(user=request.user)
        completed = user_routes.filter(
            status=UserRoute.Status.COMPLETED
        ).select_related("route")

        total_time = sum(
            ur.route.estimated_duration for ur in completed
        )
        total_budget = sum(
            ur.route.budget_max or Decimal("0") for ur in completed
        )

        data = {
            "total_routes": user_routes.count(),
            "completed_routes": completed.count(),
            "total_time_minutes": total_time,
            "total_budget": total_budget,
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data)
