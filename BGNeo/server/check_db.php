<?php
$pdo = new PDO('sqlite:c:/Users/QiReal/Desktop/NknafPHP/BGNeo/server/storage/blog.db');
$r = $pdo->query('SELECT COUNT(*) as count FROM articles');
var_dump($r->fetch(PDO::FETCH_ASSOC));

$r2 = $pdo->query('SELECT name FROM sqlite_master WHERE type="table"');
var_dump($r2->fetchAll(PDO::FETCH_ASSOC));
