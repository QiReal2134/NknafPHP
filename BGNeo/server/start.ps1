$env:Path = "C:\Users\QiReal\AppData\Local\Programs\PHP\8.5.3\nts\x64;" + $env:Path
php -d "extension=C:\Users\QiReal\AppData\Local\Programs\PHP\8.5.3\nts\x64\ext\php_pdo_sqlite.dll" -d "extension=C:\Users\QiReal\AppData\Local\Programs\PHP\8.5.3\nts\x64\ext\php_sqlite3.dll" -S localhost:3000 -t public
