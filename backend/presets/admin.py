from django.contrib import admin

from .models import Preset


@admin.register(Preset)
class PresetAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "headphones", "sort_order", "is_active", "updated_at"]
    list_editable = ["sort_order", "is_active"]
    list_filter = ["category", "is_active", "headphones"]
    search_fields = ["name", "description"]
