from django.contrib import admin

from .models import SharedProject


@admin.register(SharedProject)
class SharedProjectAdmin(admin.ModelAdmin):
    list_display = ["slug", "title", "size_bytes", "created_at", "last_accessed_at"]
    search_fields = ["slug", "title"]
    readonly_fields = ["slug", "title", "data", "size_bytes", "created_at", "last_accessed_at"]
