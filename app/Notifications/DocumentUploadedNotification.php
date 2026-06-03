<?php

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Notifications\Notification;

class DocumentUploadedNotification extends Notification
{
    public function __construct(private Document $document) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'       => "Document \"{$this->document->name}\" was uploaded successfully.",
            'document_name' => $this->document->name,
            'document_id'   => $this->document->id,
        ];
    }
}
