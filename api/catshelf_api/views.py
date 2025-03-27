from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import FileSystemStorage

from .models import User, Book
from .serializers import UserSerializer, BookSerializer
from pathlib import Path
import base64
import random
import string

import epub_meta
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated, )

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated, )
    
    def create(self, request):
        BASE_DIR = Path(__file__).resolve().parent.parent
        folder='epub' 
        file = request.FILES.get('file')
        original_file_name = file.name
        fs = FileSystemStorage(location=folder)
        
        #Save file with random file name
        random_file_name = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(5))
        random_file_full_name = f"{random_file_name}.epub"
        fs.save(random_file_full_name, file)
        
        file_url =  f"{BASE_DIR}/{folder}/{random_file_full_name}" #For reading epub meta data
        file_url_short = f"/{folder}/{random_file_full_name}" #For save to database
        
        metadata = epub_meta.get_epub_metadata(file_url, read_cover_image=True)
        cover_image_url = ''
        
        if metadata.cover_image_content:
            cover_image = metadata.cover_image_content
            cover_filename = f"{random_file_name}{metadata.cover_image_extension}"
            fh = open(f"{folder}/{cover_filename}", "wb")
            fh.write(base64.b64decode(cover_image))
            fh.close()
            cover_image_url = f"/{folder}/{cover_filename}"
        
        book = Book(
            title=metadata.title, 
            file=file_url_short,
            author=metadata.authors,
            cover=cover_image_url,
        )
        
        book.save()
        
        response = {
            'file': file_url_short,
            'title': metadata.title, 
            'author': metadata.authors,
            'cover': cover_image_url,
        }
        return Response(response)