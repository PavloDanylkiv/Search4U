from rest_framework import serializers
from .models import Route, RouteImage, RoutePoint, UserRoute, Rating


class RouteImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteImage
        fields = ("id", "image", "is_cover", "order")


class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = (
            "id",
            "name",
            "description",
            "address",
            "latitude",
            "longitude",
            "order",
            "duration_at_stop",
            "image",
        )


class RouteListSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = (
            "id",
            "name",
            "city",
            "mood",
            "budget_min",
            "budget_max",
            "estimated_duration",
            "avg_rating",
            "rating_count",
            "cover_image",
            "is_saved",
            "is_favorite",
        )

    def get_cover_image(self, obj):
        image = obj.images.filter(is_cover=True).first() or obj.images.first()
        if image:
            request = self.context.get("request")
            return request.build_absolute_uri(image.image.url) if request else image.image.url
        return None

    def _get_user_route(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return obj.user_routes.filter(user=request.user).first()

    def get_is_saved(self, obj):
        return self._get_user_route(obj) is not None

    def get_is_favorite(self, obj):
        ur = self._get_user_route(obj)
        return ur.is_favorite if ur else False

    def get_rating_count(self, obj):
        return obj.ratings.count()


class RouteDetailSerializer(RouteListSerializer):
    images = RouteImageSerializer(many=True, read_only=True)
    points = RoutePointSerializer(many=True, read_only=True)

    class Meta(RouteListSerializer.Meta):
        fields = RouteListSerializer.Meta.fields + (
            "description",
            "images",
            "points",
            "created_at",
        )


class UserRouteSerializer(serializers.ModelSerializer):
    route = RouteListSerializer(read_only=True)
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source="route", write_only=True
    )

    class Meta:
        model = UserRoute
        fields = (
            "id",
            "route",
            "route_id",
            "status",
            "is_favorite",
            "comment",
            "date_saved",
            "date_started",
            "date_completed",
        )
        read_only_fields = ("id", "date_saved")


class RatingSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Rating
        fields = ("id", "user_email", "score", "comment", "created_at")
        read_only_fields = ("id", "user_email", "created_at")

    def validate(self, attrs):
        request = self.context["request"]
        route = self.context["route"]
        if (
            self.instance is None
            and Rating.objects.filter(user=request.user, route=route).exists()
        ):
            raise serializers.ValidationError("You have already rated this route.")
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data["route"] = self.context["route"]
        return super().create(validated_data)
