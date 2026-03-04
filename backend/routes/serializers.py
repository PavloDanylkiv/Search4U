from rest_framework import serializers
from .models import Route, RouteImage, RoutePoint, RoutePointPhoto, UserRoute, Rating


class RouteImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteImage
        fields = ("id", "image", "is_cover", "order")


class RoutePointPhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = RoutePointPhoto
        fields = ("id", "image", "image_url", "user_name", "created_at")
        read_only_fields = ("id", "image_url", "user_name", "created_at")
        extra_kwargs = {
            "image": {"write_only": True},  # приймаємо при POST, не повертаємо назад
        }

    def get_image_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    def get_user_name(self, obj):
        u = obj.user
        if u.first_name:
            last_initial = f" {u.last_name[0]}." if u.last_name else ""
            return f"{u.first_name}{last_initial}"
        # fallback: частина до @ без домену
        return u.email.split("@")[0]


class RoutePointSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    user_photos = RoutePointPhotoSerializer(many=True, read_only=True)

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
            "image_url",
            "user_photos",
        )

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class RouteListSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    first_point = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = (
            "id",
            "name",
            "city",
            "mood",
            "category",
            "budget_min",
            "budget_max",
            "estimated_duration",
            "avg_rating",
            "rating_count",
            "cover_image",
            "is_saved",
            "is_favorite",
            "first_point",
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
        # rating_count_annotated — анотується в RouteListView через Count('ratings'),
        # що дає один COUNT-запит на всю колекцію замість N окремих SELECT
        if hasattr(obj, "rating_count_annotated"):
            return obj.rating_count_annotated
        return obj.ratings.count()  # fallback (наприклад, RouteDetailView)

    def get_first_point(self, obj):
        pt = obj.points.order_by("order").first()
        if pt:
            return {"latitude": str(pt.latitude), "longitude": str(pt.longitude)}
        return None


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
    user_rating = serializers.SerializerMethodField()

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
            "user_rating",
        )
        read_only_fields = ("id", "date_saved")

    def get_user_rating(self, obj):
        r = obj.route.ratings.filter(user=obj.user).first()
        if r:
            return {"id": r.id, "score": r.score, "comment": r.comment}
        return None


class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ("id", "user_name", "score", "comment", "created_at")
        read_only_fields = ("id", "user_name", "created_at")

    def get_user_name(self, obj):
        u = obj.user
        if u.first_name:
            last_initial = f" {u.last_name[0]}." if u.last_name else ""
            return f"{u.first_name}{last_initial}"
        return u.email.split("@")[0]

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
