# FileZilla Server ?„¤ì¹? ë°? ?„¤? • ê°??´?“œ

## 1. FileZilla Server ?„¤ì¹?

### Windows

1. [FileZilla Server ?‹¤?š´ë¡œë“œ](https://filezilla-project.org/download.php?type=server)
2. ?„¤ì¹? ?ŒŒ?¼ ?‹¤?–‰ ë°? ?„¤ì¹? ?™„ë£?
3. FileZilla Server Interface ?‹¤?–‰

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install filezilla-server
```

?˜?Š” ì§ì ‘ ë¹Œë“œ:

```bash
wget https://download.filezilla-project.org/server/FileZilla_Server_1.x.x_linux_x86_64.tar.gz
tar -xzf FileZilla_Server_*.tar.gz
cd FileZilla_Server_*/
sudo ./setup.sh
```

## 2. FileZilla Server ê¸°ë³¸ ?„¤? •

### Windows

1. FileZilla Server Interface ?‹¤?–‰
2. ?„œë²? ?—°ê²? (ê¸°ë³¸: localhost, ?¬?Š¸ 14147)
3. Edit ?†’ Settings ë©”ë‰´ ?„ ?ƒ

### ê¸°ë³¸ ?„¤? •

- **General Settings**
  - Welcome message: ì»¤ë?¤ë‹ˆ?‹° ?ŒŒ?¼ ?„œë²?
  - Admin port: 14147 (ê¸°ë³¸ê°?)
  - Admin password: ë³´ì•ˆ ê°•í•œ ë¹„ë??ë²ˆí˜¸ ?„¤? •

- **SSL/TLS Settings** (?„ ?ƒ?‚¬?•­)
  - Enable FTP over SSL/TLS: ?™œ?„±?™” ê¶Œì¥
  - Private key file, Certificate file ê²½ë¡œ ?„¤? •

- **Passive Mode Settings**
  - Use custom port range: ?™œ?„±?™”
  - Port range: 50000-51000 (?˜ˆ?‹œ)
  - External IP address: ?„œë²? ê³µì¸ IP ?…? ¥

## 3. ?‚¬?š©? ê³„ì • ?ƒ?„±

### Windows

1. Edit ?†’ Users ë©”ë‰´
2. Add ë²„íŠ¼ ?´ë¦?
3. ?‚¬?š©? ? •ë³? ?…? ¥:
   - Account: `jokerweb`
   - Password: ê°•ë ¥?•œ ë¹„ë??ë²ˆí˜¸ ?„¤? •
   - Enable account: ì²´í¬

4. Shared folders ?ƒ­
   - Add ë²„íŠ¼ ?´ë¦?
   - Directory: ?—…ë¡œë“œ ?””? ‰?† ë¦? ê²½ë¡œ (?˜ˆ: `C:\ftp\uploads` ?˜?Š” `/var/www/jokerweb/uploads`)
   - Aliases: `/` ?˜?Š” ë¹„ì›Œ?‘ê¸?
   - Files: Read, Write ì²´í¬
   - Directories: List, Create, Delete, Inherit ì²´í¬

5. Speed limits (?„ ?ƒ?‚¬?•­)
   - Download speed limit: ?•„?š”?‹œ ?„¤? •
   - Upload speed limit: ?•„?š”?‹œ ?„¤? •

## 4. ?””? ‰?† ë¦? êµ¬ì¡°

```
/uploads
  /2024
    /01
      /15
        [?—…ë¡œë“œ?œ ?ŒŒ?¼?“¤]
        /thumbnails
          [?¸?„¤?¼ ?ŒŒ?¼?“¤]
```

## 5. ë°©í™”ë²? ?„¤? •

### Windows

1. Windows Defender ë°©í™”ë²? ?†’ ê³ ê¸‰ ?„¤? •
2. ?¸ë°”ìš´?“œ ê·œì¹™ ?†’ ?ƒˆ ê·œì¹™
3. ?¬?Š¸ ?„ ?ƒ
4. TCP, ?Š¹? • ë¡œì»¬ ?¬?Š¸: 21 (?˜?Š” ?„¤? •?•œ FTP ?¬?Š¸)
5. ?—°ê²? ?—ˆ?š©
6. ?„ë©”ì¸, ê°œì¸, ê³µìš© ëª¨ë‘ ì²´í¬
7. ?´ë¦?: FileZilla FTP Server

### Linux (UFW)

```bash
sudo ufw allow 21/tcp
sudo ufw allow 50000:51000/tcp  # Passive mode ?¬?Š¸ ë²”ìœ„
```

## 6. Spring Boot ?„¤? •

### application-dev.properties

```properties
# FTP/SFTP ?„¤? •
ftp.enabled=true
ftp.use-sftp=false
ftp.host=localhost
ftp.port=21
ftp.username=jokerweb
ftp.password=your_secure_password
ftp.base-path=/uploads
ftp.base-url=http://localhost:8080/files
ftp.timeout=30000
ftp.max-file-size=104857600  # 100MB
```

### application-prod.properties

```properties
# FTP/SFTP ?„¤? •
ftp.enabled=true
ftp.use-sftp=false
ftp.host=your-ftp-server-ip
ftp.port=21
ftp.username=jokerweb
ftp.password=${FTP_PASSWORD}
ftp.base-path=/uploads
ftp.base-url=https://your-domain.com/files
ftp.timeout=30000
ftp.max-file-size=104857600
```

## 7. Nginx ?„¤? • (?ŒŒ?¼ ?„œë¹?)

?ŒŒ?¼?„ ?›¹?—?„œ ? ‘ê·¼í•  ?ˆ˜ ?ˆ?„ë¡? Nginx ?„¤? •:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # ?ŒŒ?¼ ?‹¤?š´ë¡œë“œ ê²½ë¡œ
    location /files/ {
        alias /var/www/jokerweb/uploads/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ?—…ë¡œë“œ?œ ?ŒŒ?¼ ? ‘ê·?
    location ~ ^/files/(.+)$ {
        alias /var/www/jokerweb/uploads/$1;
        try_files $uri =404;
    }
}
```

## 8. SFTP ?‚¬?š© ?‹œ (SSH ê¸°ë°˜)

Linux ?„œë²„ì—?„œ SFTPë¥? ?‚¬?š©?•˜? ¤ë©?:

1. SSH ?„œë²„ê?? ?´ë¯? ?„¤ì¹˜ë˜?–´ ?ˆ?Œ (?¼ë°˜ì ?œ¼ë¡? ê¸°ë³¸ ?„¤ì¹˜ë¨)
2. ?‚¬?š©? ê³„ì • ?ƒ?„±:
   ```bash
   sudo useradd -m -s /bin/bash jokerweb
   sudo passwd jokerweb
   ```

3. ?—…ë¡œë“œ ?””? ‰?† ë¦? ?ƒ?„±:
   ```bash
   sudo mkdir -p /var/www/jokerweb/uploads
   sudo chown jokerweb:jokerweb /var/www/jokerweb/uploads
   sudo chmod 755 /var/www/jokerweb/uploads
   ```

4. Spring Boot ?„¤? •:
   ```properties
   ftp.use-sftp=true
   ftp.port=22
   ```

## 9. ë³´ì•ˆ ê¶Œì¥?‚¬?•­

1. **ê°•ë ¥?•œ ë¹„ë??ë²ˆí˜¸ ?‚¬?š©**
2. **FTP over SSL/TLS ?™œ?„±?™”** (FTPS)
3. **?Š¹? • IPë§? ? ‘ê·? ?—ˆ?š©** (ê°??Š¥?•œ ê²½ìš°)
4. **? •ê¸°ì ?¸ ë¡œê·¸ ëª¨ë‹ˆ?„°ë§?**
5. **?ŒŒ?¼ ?¬ê¸? ? œ?•œ ?„¤? •**
6. **?””? ‰?† ë¦? ê¶Œí•œ ìµœì†Œ?™”** (?•„?š”?•œ ê¶Œí•œë§? ë¶??—¬)

## 10. ?…Œ?Š¤?Š¸

### FTP ?´?¼?´?–¸?Š¸ë¡? ?…Œ?Š¤?Š¸

1. FileZilla Client ?‹¤?š´ë¡œë“œ
2. ?˜¸?Š¤?Š¸: localhost (?˜?Š” ?„œë²? IP)
3. ?¬?Š¸: 21
4. ?”„ë¡œí† ì½?: FTP - File Transfer Protocol
5. ë¡œê·¸?˜¨ ?œ ?˜•: ?¼ë°?
6. ?‚¬?š©?: jokerweb
7. ë¹„ë??ë²ˆí˜¸: ?„¤? •?•œ ë¹„ë??ë²ˆí˜¸
8. ?—°ê²? ?…Œ?Š¤?Š¸

### Spring Boot ?• ?”Œë¦¬ì???´?…˜ ?…Œ?Š¤?Š¸

```bash
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

## 11. ?Š¸?Ÿ¬ë¸”ìŠˆ?Œ…

### ?—°ê²? ?‹¤?Œ¨

- ë°©í™”ë²? ?¬?Š¸ ?™•?¸
- FileZilla Server ?ƒ?ƒœ ?™•?¸
- ?‚¬?š©? ê³„ì • ë°? ë¹„ë??ë²ˆí˜¸ ?™•?¸
- Passive mode ?¬?Š¸ ë²”ìœ„ ?™•?¸

### ?ŒŒ?¼ ?—…ë¡œë“œ ?‹¤?Œ¨

- ?””? ‰?† ë¦? ê¶Œí•œ ?™•?¸
- ?””?Š¤?¬ ê³µê°„ ?™•?¸
- ?ŒŒ?¼ ?¬ê¸? ? œ?•œ ?™•?¸

### ?ŒŒ?¼ ? ‘ê·? ë¶ˆê??

- Nginx ?„¤? • ?™•?¸
- ?ŒŒ?¼ ê²½ë¡œ ?™•?¸
- ?ŒŒ?¼ ê¶Œí•œ ?™•?¸

## 12. ëª¨ë‹ˆ?„°ë§?

FileZilla Server Interface?—?„œ:
- ?˜„?¬ ?—°ê²°ëœ ?‚¬?š©? ?™•?¸
- ?—…ë¡œë“œ/?‹¤?š´ë¡œë“œ ?†?„ ëª¨ë‹ˆ?„°ë§?
- ë¡œê·¸ ?™•?¸

ë¡œê·¸ ?œ„ì¹?:
- Windows: `C:\Program Files\FileZilla Server\Logs\`
- Linux: `/var/log/filezilla-server/`
