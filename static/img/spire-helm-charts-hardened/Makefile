all: multicluster-alternate.png multicluster.png securitycluster.png singlehardened.png root-k8s.png

root-k8s.png: root-k8s.dot
	dot -Tpng root-k8s.dot -o root-k8s.png

multicluster-alternate.png: multicluster-alternate.dot
	dot -Tpng multicluster-alternate.dot -o multicluster-alternate.png

multicluster.png: multicluster.dot
	dot -Tpng multicluster.dot -o multicluster.png

securitycluster.png: securitycluster.dot
	dot -Tpng securitycluster.dot -o securitycluster.png

singlehardened.png: singlehardened.dot
	dot -Tpng singlehardened.dot -o singlehardened.png

