package VHSAPI::Datapoint;
use Moose;
use Dancer ':syntax';
use DateTime;
use methods-invoker;

has 'name' => (is => 'rw', isa => 'Str', required => 1);
has 'value' => (is => 'rw', isa => 'Str', required => 1);
has 'last_updated' => (is => 'rw', isa => 'Int', required => 1);
has 'space' => (is => 'rw', isa => 'Object');
has 'datetime' => (is => 'ro', isa => 'Object', lazy_build => 1);

extends 'VHSAPI::Object';

method All_for_hackspace ($class: $space) {
    my $name = $space->name;
    return [
        map { $_->space($space); $_ }
          map { $class->thaw( $class->redis->get("$name-data-$_") ) }
            $class->redis->smembers("$name-datas")
    ];
}

method uri     { $->space->uri . '/data/' . $->name }
method to_hash { return { map { $_ => $->$_ } qw/name value last_updated/ } }

method update ($value) {
    return if $value eq $->value;
    $->value($value);
    $->last_updated(time);
    debug $->freeze;
    my $frozen = $->freeze;
    $->redis->set($->space->name . '-data-' . $->name, $frozen);
    $->redis->lpush($->space->name . '-datahistory-' . $->name, $frozen);

    $->space->notify($self);
}

method _build_datetime {
    my $dt = DateTime->from_epoch(epoch => $->last_updated);
    $dt->set_time_zone('America/Vancouver');
    return $dt;
}
