from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import FileSystemStorage

from .models import User, Book
from .serializers import UserSerializer, BookSerializer
from pathlib import Path
import os
import json
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
    
    def partial_update(self, request, pk=None):
        book_data = json.loads(request.POST.get('data'))
        file = request.FILES.get('file')
        
        new_data = {
            'title': book_data['title'],
        }
        
        if book_data['author']:
            new_data['author'] = json.dumps(book_data['author'])
            
        if book_data['description']:
            new_data['description'] = book_data['description']
        
        if book_data['isbn']:
            new_data['isbn'] = book_data['isbn']
        
        #Save file with random file name    
        if file:
            BASE_DIR = Path(__file__).resolve().parent.parent
            folder='epub'
            filename, extension = os.path.splitext(file.name)
            fs = FileSystemStorage(location=folder)
            random_file_name = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(5))
            full_file_name = f"{random_file_name}{extension}"
            fs.save(full_file_name, file)
            cover_image_url = f"/{folder}/{full_file_name}"
            new_data['cover'] = cover_image_url
        
        response = {
            'title': book_data['title'],
            'author': json.dumps(book_data['author']),
            'description': book_data['description'],
            'isbn': book_data['isbn'],
        }
        
        instance = self.get_object()
        serializer = BookSerializer(
            instance,
            data=new_data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(response)
    
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
            author=json.dumps(metadata.authors),
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
    
    def destroy(self, request, pk=None):
        instance = self.get_object()
        BASE_DIR = Path(__file__).resolve().parent.parent
        file_url =  f"{BASE_DIR}{instance.file}"
        #Remove file from storage
        os.remove(file_url)
        
        #Remove cover image from storage
        if instance.cover:
            cover_url =  f"{BASE_DIR}{instance.cover}"
            os.remove(cover_url)
        instance.delete()     
        return Response(instance.id)