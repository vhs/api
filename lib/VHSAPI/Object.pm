package VHSAPI::Object;
use Moose;
use Dancer ':syntax';
use Dancer::Plugin::Redis;
use JSON ();
use methods-invoker;

method All ($class:) {
    my $key = ref($class) || $class;
    $key =~ s/^.+::(\w+)$/lc($1) . 's'/e;
    return [map { debug "Loading object '$_'"; $class->thaw(redis->get($_)) } redis->smembers($key)];
}

method freeze { JSON->new->encode($self->to_hash) }
method thaw   ($class: $val) {
    return undef unless $val;
    my $json = JSON->new->decode($val);
    return $class->new($json);
}

