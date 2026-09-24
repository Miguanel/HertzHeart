from django.core.management.base import BaseCommand

from frequencies.sync import sync_library


class Command(BaseCommand):
    help = "Synchronizuje bibliotekę częstotliwości z frequencies/library_data.py"

    def handle(self, *args, **options):
        created, updated, skipped = sync_library()
        self.stdout.write(self.style.SUCCESS(f"Biblioteka: {created} nowych, {updated} zaktualizowanych, {skipped} pominiętych (ręczne)."))
