from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from rest_framework import serializers
from .models import User


class RegisterSerializer(BaseRegisterSerializer):
    username = None
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name", "")
        user.last_name = self.cleaned_data.get("last_name", "")
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "first_name", "last_name", "avatar", "bio")
        read_only_fields = ("id", "email")


class UserStatsSerializer(serializers.Serializer):
    total_routes = serializers.IntegerField()
    completed_routes = serializers.IntegerField()
    total_time_minutes = serializers.IntegerField()
    total_budget = serializers.DecimalField(max_digits=10, decimal_places=2)
