<?php

return [
    'enabled' => env('AUDITING_ENABLED', true),

    'implementation' => OwenIt\Auditing\Models\Audit::class,

    'user' => [
        'morph_prefix' => 'user',
        'guards' => ['web', 'api'],
        'resolver' => OwenIt\Auditing\Resolvers\UserResolver::class,
    ],

    'resolver' => [
        'user'       => OwenIt\Auditing\Resolvers\UserResolver::class,
        'ip_address' => OwenIt\Auditing\Resolvers\IpAddressResolver::class,
        'user_agent' => OwenIt\Auditing\Resolvers\UserAgentResolver::class,
        'url'        => OwenIt\Auditing\Resolvers\UrlResolver::class,
    ],

    'events' => [
        'created',
        'updated',
        'deleted',
        'restored',
    ],

    'strict'    => false,
    'timestamps' => false,
    'threshold'  => 0,
    'driver'     => 'database',

    'drivers' => [
        'database' => [
            'table'      => 'audits',
            'connection' => null,
        ],
    ],

    'queue' => [
        'enable'     => false,
        'connection' => 'sync',
        'queue'      => 'default',
        'delay'      => null,
    ],

    'console' => false,
];
