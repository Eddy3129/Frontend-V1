export function AnnouncementsCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <span className="text-amber-600">📢</span>
        </div>
        <h3 className="font-semibold text-sm">Announcements</h3>
      </div>
      <div className="space-y-3 max-h-40 overflow-y-auto">
        {/* Mock announcements */}
        <div className="p-3 bg-muted/30 rounded-xl border-l-4 border-primary">
          <p className="text-sm font-medium">Campaign Launch Success!</p>
          <p className="text-xs text-muted-foreground mt-1">
            We've reached 25% of our goal in the first week!
          </p>
          <p className="text-xs text-muted-foreground mt-2">2 days ago</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-xl border-l-4 border-muted-foreground/30">
          <p className="text-sm font-medium">Weekly Update</p>
          <p className="text-xs text-muted-foreground mt-1">Farm preparations are underway.</p>
          <p className="text-xs text-muted-foreground mt-2">5 days ago</p>
        </div>
      </div>
    </div>
  )
}
