from decimal import Decimal
from django.db.models import Sum
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
        completed_count = user_routes.filter(
            status=UserRoute.Status.COMPLETED
        ).count()

        # Агрегація на рівні БД — один запит замість ітерації по Python
        agg = user_routes.aggregate(
            total_time=Sum("route__estimated_duration"),
            total_budget=Sum("route__budget_max"),
        )

        data = {
            "total_routes": user_routes.count(),
            "completed_routes": completed_count,
            "total_time_minutes": agg["total_time"] or 0,
            "total_budget": agg["total_budget"] or Decimal("0"),
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data)
