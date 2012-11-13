package VHSAPI;
use Dancer ':syntax';
use VHSAPI::Redis;
use VHSAPI::Hackspace;

our $VERSION = '0.1';

hook before => sub {
    VHSAPI::Redis->Init;
    if (request->path =~ m#^/s/(\w+)#) {
        var space => VHSAPI::Hackspace->By_name($1);
    }
};

hook before_template => sub {
    my $p = shift;
    $p->{hackspaces} = VHSAPI::Hackspace->All;
    $p->{space} = vars->{space};
};

get '/' => sub {
    template 'index';
};

get '/s/:spacename/data/:dataname.json' => sub {
    my $space = vars->{space} or redirect '/';
    my $dp = $space->datapoint(params->{dataname});
    return $dp->to_hash;
};

get '/s/:spacename/data/:dataname/update' => sub {
    my $space = vars->{space} or redirect '/';
    my $dataname = params->{dataname};
    my $value    = params->{value};
    my $dp    = $space->datapoint($dataname);
    if ($dp) {
        debug "Updating datapoint";
        $dp->update($value);
    }
    else {
        debug "Creating datapoint";
        $dp = $space->add_datapoint($dataname, $value);
    }
    return { status => 'OK', result => $dp->to_hash };
};

get '/s/:spacename/data/:dataname' => sub {
    my $space = vars->{space} or redirect '/';
    template 'data', { datapoint => $space->datapoint(params->{dataname}) };
};


true;
