<?php

use Spatie\Permission\Models\Role;

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

// Registration always assigns the 'user' role, so a new account starts on the
// documents list rather than the admin-only dashboard.
test('new users can register', function () {
    Role::create(['name' => 'user']);

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('documents.index', absolute: false));
});
