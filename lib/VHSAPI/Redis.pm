package VHSAPI::Redis;
use Moose;
use methods-invoker;
use Redis;

my $Redis;
method Init { $Redis = Redis->new }
method Redis {$Redis || $->Init }
