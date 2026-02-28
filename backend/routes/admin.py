from django.contrib import admin
from .models import Route, RouteImage, RoutePoint, UserRoute, Rating


class RouteImageInline(admin.TabularInline):
    model = RouteImage
    extra = 1


class RoutePointInline(admin.TabularInline):
    model = RoutePoint
    extra = 1


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "mood", "category", "budget_min", "budget_max", "estimated_duration", "avg_rating")
    list_filter = ("mood", "city", "category")
    search_fields = ("name", "city", "description")
    readonly_fields = ("avg_rating", "created_at", "updated_at")
    inlines = [RouteImageInline, RoutePointInline]


@admin.register(UserRoute)
class UserRouteAdmin(admin.ModelAdmin):
    list_display = ("user", "route", "status", "is_favorite", "date_saved")
    list_filter = ("status", "is_favorite")
    search_fields = ("user__email", "route__name")


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("user", "route", "score", "created_at")
    list_filter = ("score",)
    search_fields = ("user__email", "route__name")
