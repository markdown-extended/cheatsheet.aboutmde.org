#!/usr/bin/env php
<?php

// show errors at least initially
ini_set('display_errors','1');
error_reporting(-1);

// namespaces loader
if (file_exists($a = __DIR__.'/vendor/autoload.php')) {
    require $a;
} else {
    die('You need to run `composer install` to install dependencies!');
}

// launch console API
if (php_sapi_name() === 'cli') { 
    @set_time_limit(0);
    $console = new \MdeReminders\CommandLine\Reminders();
    $console->run();
} else {
    echo 'This file is for command line usage only!';
    exit(1);
}

// Endfile
