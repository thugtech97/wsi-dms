<?php

use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (admin only)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Documents
    Route::get('/documents/search', [DocumentController::class, 'search'])->name('documents.search');
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::post('/documents/{document}/scan', [DocumentController::class, 'recordScan'])->name('documents.scan');
    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

    // Document Types
    Route::get('/document-types', [DocumentTypeController::class, 'index'])->name('document-types.index');
    Route::post('/document-types', [DocumentTypeController::class, 'store'])->name('document-types.store');
    Route::put('/document-types/{documentType}', [DocumentTypeController::class, 'update'])->name('document-types.update');
    Route::delete('/document-types/{documentType}', [DocumentTypeController::class, 'destroy'])->name('document-types.destroy');

    // Folders (admin only)
    Route::get('/folders', [FolderController::class, 'index'])->name('folders.index');
    Route::post('/folders', [FolderController::class, 'store'])->name('folders.store');
    Route::put('/folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');

    // Users (admin only)
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::put('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.update-role');
    Route::post('/roles', [UserController::class, 'storeRole'])->name('roles.store');
    Route::delete('/roles/{role}', [UserController::class, 'destroyRole'])->name('roles.destroy');

    // Audit Trail (admin only)
    Route::get('/audit-trail', [AuditTrailController::class, 'index'])->name('audit-trail.index');

    // Reports (admin only)
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/print/user-activity', [ReportController::class, 'printUserActivity'])->name('reports.print.user-activity');
    Route::get('/reports/print/document-list', [ReportController::class, 'printDocumentList'])->name('reports.print.document-list');

    // Settings (admin only)
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
