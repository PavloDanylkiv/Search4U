import django_filters
from .models import Route


class RouteFilter(django_filters.FilterSet):
    city     = django_filters.CharFilter(field_name="city",     lookup_expr="icontains")
    mood     = django_filters.CharFilter(field_name="mood",     lookup_expr="exact")
    category = django_filters.CharFilter(field_name="category", lookup_expr="exact")
    budget_max__lte = django_filters.NumberFilter(field_name="budget_max",          lookup_expr="lte")
    budget_min__gte = django_filters.NumberFilter(field_name="budget_min",          lookup_expr="gte")
    budget_max__gte = django_filters.NumberFilter(field_name="budget_max",          lookup_expr="gte")
    duration__lte   = django_filters.NumberFilter(field_name="estimated_duration",  lookup_expr="lte")

    class Meta:
        model = Route
        fields = ["city", "mood", "category"]
