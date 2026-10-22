<?php
// Migration only: delete once the Astro repo is the source.
//
// Run inside the Laravel repo:
//   OUT=~/Projects/jothamlim.com-astro/DEV_FILES/golden/heading-ids.json php artisan tinker --execute 'include "'$PWD'/../jothamlim.com-astro/scripts/dump-heading-ids.php";'
// Writes, for every published jothamlim.com page, the ids and text of the
// h2–h4 headings the `wiki` parser gives its body: the golden set for the
// Astro project's heading-id plugin.
use Statamic\Facades\Entry;
use Statamic\Facades\Site;

Site::setCurrent(getenv('SITE') ?: 'jothamlim');
$out = [];

foreach (Entry::query()->where('site', Site::current()->handle())->whereStatus('published')->get() as $entry) {
    if (! $entry->url()) {
        continue;
    }

    $html = (string) $entry->augmentedValue('content');
    preg_match_all('/<h([2-4]) id="([^"]*)">(.*?)<\/h\1>/s', $html, $matches, PREG_SET_ORDER);

    $out[$entry->url()] = array_map(fn (array $h) => [
        'level' => (int) $h[1],
        'id' => $h[2],
        'text' => html_entity_decode(trim(preg_replace('/\s+/', ' ', strip_tags($h[3]))), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
    ], $matches);
}

file_put_contents(getenv('OUT') ?: '/tmp/heading-ids.json', json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo count($out)." pages, ".array_sum(array_map('count', $out))." headings\n";
