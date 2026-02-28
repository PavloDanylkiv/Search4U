from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Route(models.Model):
    class Mood(models.TextChoices):
        CALM = "calm", "Calm"
        ADVENTUROUS = "adventurous", "Adventurous"
        CURIOUS = "curious", "Curious"

    class Category(models.TextChoices):
        PARKS = "parks", "Parks"
        MUSEUMS = "museums", "Museums"
        CAFES = "cafes", "Cafes"
        MIXED = "mixed", "Mixed"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=100, db_index=True)
    mood = models.CharField(max_length=20, choices=Mood.choices, db_index=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, blank=True, default="mixed"
    )
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_duration = models.PositiveIntegerField(help_text="Duration in minutes")
    avg_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0, editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.city})"

    def update_avg_rating(self):
        from django.db.models import Avg

        result = self.ratings.aggregate(avg=Avg("score"))["avg"]
        self.avg_rating = result or 0
        self.save(update_fields=["avg_rating"])


class RouteImage(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="routes/")
    is_cover = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Image for {self.route.name}"


class RoutePoint(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="points")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    order = models.PositiveSmallIntegerField(default=0)
    duration_at_stop = models.PositiveIntegerField(
        default=0, help_text="Time to spend here in minutes"
    )
    image = models.ImageField(upload_to="points/", blank=True, null=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.name} — {self.route.name}"


class UserRoute(models.Model):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_routes",
    )
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="user_routes"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNED
    )
    is_favorite = models.BooleanField(default=False)
    comment = models.TextField(blank=True)
    date_saved = models.DateTimeField(auto_now_add=True)
    date_started = models.DateTimeField(null=True, blank=True)
    date_completed = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "route")
        ordering = ["-date_saved"]

    def __str__(self):
        return f"{self.user.email} — {self.route.name} [{self.status}]"


class Rating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="ratings"
    )
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "route")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} rated {self.route.name}: {self.score}/5"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.route.update_avg_rating()

    def delete(self, *args, **kwargs):
        route = self.route
        super().delete(*args, **kwargs)
        route.update_avg_rating()
