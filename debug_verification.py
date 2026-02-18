
import sys
import os
import django

# Add backend to path
sys.path.append('/home/karan-pokhrel/Desktop/Document_Generator_backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DocumentGenerator.settings')
django.setup()

from backendapp.models import Document

code = '1A45E736'
print(f"Checking for document with tracking_field: '{code}'")

try:
    doc = Document.objects.get(tracking_field=code)
    print(f"Found document: {doc}")
    print(f"ID: {doc.id}")
    print(f"Tracking Field: '{doc.tracking_field}'")
except Document.DoesNotExist:
    print("Document not found.")

print("\nListing all documents (first 10):")
for d in Document.objects.all()[:10]:
    print(f"ID: {d.id}, Tracking: '{d.tracking_field}'")
