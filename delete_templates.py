import os, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend_project.settings")
django.setup()

from backendapp.models import DocumentType, User

system_names = ['Certificate', 'Receipt', 'Ticket', 'Letter', 'ID Card']
deleted_count = 0

for name in system_names:
    t = DocumentType.objects.filter(name=name).first()
    if t:
        print(f"Deleting {t.name} (Created by: {t.created_by})")
        t.delete()
        deleted_count += 1
        
print(f"Deleted {deleted_count} system templates.")
