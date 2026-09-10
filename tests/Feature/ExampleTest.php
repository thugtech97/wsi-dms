<?php

// There is no public landing page: '/' sends a visitor to the login screen.
it('sends a visitor to the login screen', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login', absolute: false));
});
