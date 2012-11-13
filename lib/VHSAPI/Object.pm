package VHSAPI::Object;
use Moose;
use Dancer ':syntax';
use JSON ();
use VHSAPI::Redis;
use methods-invoker;

method All ($class:) {
    my $key = ref($class) || $class;
    $key =~ s/^.+::(\w+)$/lc($1) . 's'/e;
    return [map { debug "Loading object '$_'"; $class->thaw($class->redis->get($_)) } $class->redis->smembers($key)];
}

method freeze { JSON->new->encode($self->to_hash) }
method thaw   ($class: $val) {
    return undef unless $val;
    my $json = JSON->new->decode($val);
    return $class->new($json);
}

method redis { VHSAPI::Redis->Redis }

