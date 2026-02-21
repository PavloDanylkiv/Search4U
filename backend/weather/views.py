import requests
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


class WeatherView(APIView):
    """
    GET /api/weather/?city=Kyiv
    Проксі до OpenWeatherMap API.
    """

    def get(self, request):
        city = request.query_params.get("city", "").strip()
        if not city:
            return Response(
                {"detail": "Query param 'city' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            return Response(
                {"detail": "Weather service is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            response = requests.get(
                OPENWEATHER_URL,
                params={"q": city, "appid": api_key, "units": "metric", "lang": "en"},
                timeout=5,
            )
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            if exc.response.status_code == 404:
                return Response(
                    {"detail": f"City '{city}' not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(
                {"detail": "Weather service error."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except requests.exceptions.RequestException:
            return Response(
                {"detail": "Could not reach weather service."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = response.json()
        return Response(
            {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temp": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "wind_speed": data["wind"]["speed"],
            }
        )
