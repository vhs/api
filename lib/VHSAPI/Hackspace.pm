package VHSAPI::Hackspace;
use Dancer ':syntax';
use Moose;
use VHSAPI::Datapoint;
use methods-invoker;
use Net::Twitter::Lite;

has 'name' => (is => 'rw', isa => 'Str', required => 1);
has 'title' => (is => 'rw', isa => 'Str', required => 1);
has 'datas' => (is => 'rw', isa => 'ArrayRef', lazy_build => 1);

extends 'VHSAPI::Object';

method uri { '/s/' . $->name }

method By_name ($class: $name) { $class->thaw( $class->redis->get($name) ) }

method _build_datas { VHSAPI::Datapoint->All_for_hackspace($self) }

method datapoint ($name) {
    my $keyname = $->name . '-data-' . $name;
    debug "loading @{[$->name]} datapoint $name from $keyname";
    my $dp =  VHSAPI::Datapoint->thaw( $->redis->get($keyname) );
    unless ($dp) {
        debug "Couldn't find datapoint at $keyname";
        return undef;
    }
    $dp->space($self);
    return $dp;
}

method add_datapoint ($name, $value) {
    my $dp = VHSAPI::Datapoint->new(
        name => $name,
        value => $value,
        last_updated => time(),
    );
    $->redis->set($->name . '-data-' . $name, $dp->freeze);
    return $->datapoint($name);
}

method notify ($dp) {
    my $T = config->{Twitter};
    my $nt = Net::Twitter::Lite->new(
        useragent       => 'VHSAPI',
        consumer_key    => $T->{consumer_key},
        consumer_secret => $T->{consumer_secret},
        legacy_lists_api => 0,
    );
    $nt->access_token($T->{access_token});
    $nt->access_token_secret($T->{access_token_secret});
    unless ($nt->authorized) {
        die "Twitter oauth failed!";
    }
    my $result = eval { $nt->update("The @{[$dp->name]} is now @{[$dp->value]}.") };
    if ($@) {
        debug "Tweet failed: $@";
    }
    return $nt;

}
