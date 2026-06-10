<%@page import="java.util.ArrayList"%>
<%@page import="java.io.InputStream"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="org.w3c.dom.NodeList"%>
<%@page import="org.w3c.dom.Node"%>
<%@page import="org.w3c.dom.Element"%>
<%@page import="javax.xml.parsers.DocumentBuilderFactory"%>
<%@page import="org.w3c.dom.Document"%>
<%@page import="java.net.URL"%>

<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>향토음식</title>
<script type="text/javascript">
//검색
function fncSearch(){
	with(document.searchApiForm){
		pageNo.value = "1";
		method="get";
		action = "fdNmLst.jsp";
		target = "_self";
		submit();
	}
}

function fncTabChg(type){
	with(document.searchApiForm){
		pageNo.value = "1";
		if(type == 'A'){
			schType.value = type;
			schTrditfdNm2.value="";
			sidoCode.value="";
			food_type_ctg01.value="";
			food_type_ctg02.value="";
			food_type_ctg03.value="";
			food_type_ctg04.value="";
			fd_mt_ctg01.value="";
			fd_mt_ctg02.value="";
			ck_ry_ctg01.value="";
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
			tema_ctg01.value="";
		}else if(type == 'B'){
			schType.value = type;
			schText.value="";
			schTrditfdNm.value="";
		}else if(type == 'food_type_ctg01'){
			 food_type_ctg02.value="";
			 food_type_ctg03.value="";
			 food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg02'){
			food_type_ctg03.value="";
			food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg03'){
				food_type_ctg04.value="";
		}
		else if(type == 'fd_mt_ctg01'){
			fd_mt_ctg02.value="";
		}
		else if(type == 'ck_ry_ctg01'){
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
		}
		else if(type == 'ck_ry_ctg02'){
			ck_ry_ctg03.value="";
		}
		method="get";
		action = "fdNmLst.jsp";
		target = "_self";
		submit();
	}
}
function fncContSearch(val){
	with(document.searchApiForm){
		pageNo.value = "1";
		schText.value = val;
		method="get";
		action = "fdNmLst.jsp";
		target = "_self";
		submit();
	}
}

//페이지 이동
function fncGoPage(page){
	with(document.searchApiForm){
		pageNo.value = page;
		method="get";
		action = "fdNmLst.jsp";
		target = "_self";
		submit();
	}
}

//상세
function fncView(dNo){
	with(document.searchApiForm){
		cntntsNo.value = dNo;
		method="get";
		action = "fdNmDtl.jsp";
		target = "_self";
		submit();
	}
}

//팝업 띄우기
function fncListOpen(type,dNo,nm){
	var popupUrl="fdNmPoP.jsp?type="+type+"&dNo="+dNo+"&nm="+nm;
	var popOption="width=800,height=440";
	window.open(popupUrl,"nongsaroPop",popOption);
}
</script>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토 음식</strong></h3><hr>

<%
//메인 리스트
if(true){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	String apiKey="발급받은인증키를삽입하세요";
	//서비스 명
	String serviceName="nvpcFdCkry";
	//오퍼레이션 명, 초기 목록 조회
	String operationName="fdNmLst";

	//XML 받을 URL 생성
	String parameter = "/"+serviceName+"/"+operationName;
	parameter += "?apiKey="+ apiKey;
	parameter += "&pageNo="+request.getParameter("pageNo");

	//기본검색, 상세검색
	String schType = "A";
	if(request.getParameter("schType") != null && !request.getParameter("schType").equals("")){
		schType = request.getParameter("schType");
	}
	parameter += "&schType="+schType;

	//초성검색
	String schText = "";
	if(request.getParameter("schText") != null && !request.getParameter("schText").equals("")){
		schText = request.getParameter("schText");
	}
	parameter += "&schText="+schText;


	//카테고리음식명 검색
	if(request.getParameter("schTrditfdNm")!=null&&!request.getParameter("schTrditfdNm").equals("")){
		parameter += "&schTrditfdNm="+request.getParameter("schTrditfdNm");
	}
	//음식명
	if(request.getParameter("schTrditfdNm2")!=null&&!request.getParameter("schTrditfdNm2").equals("")){
		parameter += "&schTrditfdNm2="+request.getParameter("schTrditfdNm2");
	}
	//지역
	if(request.getParameter("sidoCode")!=null&&!request.getParameter("sidoCode").equals("")){
		parameter += "&sidoCode="+request.getParameter("sidoCode");
	}
	//식품유형1
	if(request.getParameter("food_type_ctg01")!=null&&!request.getParameter("food_type_ctg01").equals("")){
		parameter += "&food_type_ctg01="+request.getParameter("food_type_ctg01");
	}
	//식품유형2
	if(request.getParameter("food_type_ctg02")!=null&&!request.getParameter("food_type_ctg02").equals("")){
		parameter += "&food_type_ctg02="+request.getParameter("food_type_ctg02");
	}
	//식품유형3
	if(request.getParameter("food_type_ctg03")!=null&&!request.getParameter("food_type_ctg03").equals("")){
		parameter += "&food_type_ctg03="+request.getParameter("food_type_ctg03");
	}
	//식품유형4
	if(request.getParameter("food_type_ctg04")!=null&&!request.getParameter("food_type_ctg04").equals("")){
		parameter += "&food_type_ctg04="+request.getParameter("food_type_ctg04");
	}
	//식재료1
	if(request.getParameter("fd_mt_ctg01")!=null&&!request.getParameter("fd_mt_ctg01").equals("")){
		parameter += "&fd_mt_ctg01="+request.getParameter("fd_mt_ctg01");
	}
	//식재료2
	if(request.getParameter("fd_mt_ctg02")!=null&&!request.getParameter("fd_mt_ctg02").equals("")){
		parameter += "&fd_mt_ctg02="+request.getParameter("fd_mt_ctg02");
	}
	//조리법1
	if(request.getParameter("ck_ry_ctg01")!=null&&!request.getParameter("ck_ry_ctg01").equals("")){
		parameter += "&ck_ry_ctg01="+request.getParameter("ck_ry_ctg01");
	}
	//조리법2
	if(request.getParameter("ck_ry_ctg02")!=null&&!request.getParameter("ck_ry_ctg02").equals("")){
		parameter += "&ck_ry_ctg02="+request.getParameter("ck_ry_ctg02");
	}
	//조리법3
	if(request.getParameter("ck_ry_ctg03")!=null&&!request.getParameter("ck_ry_ctg03").equals("")){
		parameter += "&ck_ry_ctg03="+request.getParameter("ck_ry_ctg03");
	}
	//테마
	if(request.getParameter("tema_ctg01")!=null&&!request.getParameter("tema_ctg01").equals("")){
		parameter += "&tema_ctg01="+request.getParameter("tema_ctg01");
	}
	//정렬
	if(request.getParameter("order")!=null&&!request.getParameter("order").equals("")){
		parameter += "&order="+request.getParameter("order");
	}
	//페이징
	if(request.getParameter("numOfRows")!=null&&!request.getParameter("numOfRows").equals("")){
		parameter += "&numOfRows="+request.getParameter("numOfRows");
	}
	//메인카테고리 서버와 통신
	URL apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
	InputStream apiStream = apiUrl.openStream();

	Document doc = null;
	try{
		//xml document
		doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(apiStream);
	}catch(Exception e){
		e.printStackTrace();
	}finally{
		apiStream.close();
	}

	int size = 0;

	NodeList items = null;
	NodeList rtnImgSeCodes = null;
	NodeList cntntsNos = null;
	NodeList rtnImageDcs = null;
	NodeList rtnFileCourss = null;
	NodeList rtnThumbFileNms = null;
	NodeList trditfdNms = null;
	NodeList foodTyCodeFullnames = null;
	NodeList atptCodeNms = null;
	NodeList ckryCodeFullnames = null;
	NodeList clIpcCodes = null;
	NodeList clIpcCodeNms = null;
	NodeList oldLtrtreNms = null;
	NodeList oldLtrtreEsntlCodes = null;


	items = doc.getElementsByTagName("item");
	size = doc.getElementsByTagName("item").getLength();
	rtnImgSeCodes = doc.getElementsByTagName("rtnImgSeCode");
	cntntsNos = doc.getElementsByTagName("cntntsNo");
	rtnImageDcs = doc.getElementsByTagName("rtnImageDc");
	rtnFileCourss = doc.getElementsByTagName("rtnFileCours");
	rtnThumbFileNms = doc.getElementsByTagName("rtnThumbFileNm");
	trditfdNms = doc.getElementsByTagName("trditfdNm");
	foodTyCodeFullnames = doc.getElementsByTagName("foodTyCodeFullname");
	atptCodeNms = doc.getElementsByTagName("atptCodeNm");
	ckryCodeFullnames = doc.getElementsByTagName("ckryCodeFullname");
	clIpcCodes = doc.getElementsByTagName("clIpcCode");
	clIpcCodeNms = doc.getElementsByTagName("clIpcCodeNm");
	oldLtrtreNms = doc.getElementsByTagName("oldLtrtreNm");
	oldLtrtreEsntlCodes = doc.getElementsByTagName("oldLtrtreEsntlCode");
%>
	<form name="searchApiForm">
	<input type="hidden" name="pageNo" value="<%=request.getParameter("pageNo")%>">
	<input type="hidden" name="schType" value="<%=schType%>">
	<input type="hidden" name="schText" value="<%=schText%>">
	<input type="hidden" name="cntntsNo">
	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
	<tr>
		<td align="center">
			<a href="javascript:fncTabChg('A');">  <% if ( schType.equals("A")) { %> <strong>기본검색</strong> <% }else{ %>기본검색<%} %> </a>
		</td>
		<td align="center">
			<a href="javascript:fncTabChg('B');">  <% if ( schType.equals("B")) { %> <strong>상세검색</strong> <% }else{ %>상세검색<%} %> </a>
		</td>
	</tr>
	</table>

	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
		<colgroup>
			<col style="width:10%" />
			<col/>
		</colgroup>
		<tbody>
<%
	if (schType.equals("A")){
%>
	<tr>
		<th>
			초성검색
		</th>
		<td>
			<div id="koreanSrch">
				<a href="#" onclick="javascript:fncContSearch('');return false;" style="font-weight:<%=schText.equals("")?"bold":"" %>">전체</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('가');return false;" style="font-weight:<%=schText.equals("가")?"bold":"" %>">가</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('나');return false;" style="font-weight:<%=schText.equals("나")?"bold":"" %>">나</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('다');return false;" style="font-weight:<%=schText.equals("다")?"bold":"" %>">다</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('라');return false;" style="font-weight:<%=schText.equals("라")?"bold":"" %>">라</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('마');return false;" style="font-weight:<%=schText.equals("마")?"bold":"" %>">마</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('바');return false;" style="font-weight:<%=schText.equals("바")?"bold":"" %>">바</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('사');return false;" style="font-weight:<%=schText.equals("사")?"bold":"" %>">사</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('아');return false;" style="font-weight:<%=schText.equals("아")?"bold":"" %>">아</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('자');return false;" style="font-weight:<%=schText.equals("자")?"bold":"" %>">자</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('차');return false;" style="font-weight:<%=schText.equals("차")?"bold":"" %>">차</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('카');return false;" style="font-weight:<%=schText.equals("카")?"bold":"" %>">카</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('타');return false;" style="font-weight:<%=schText.equals("타")?"bold":"" %>">타</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('파');return false;" style="font-weight:<%=schText.equals("파")?"bold":"" %>">파</a>&nbsp;
				<a href="#" onclick="javascript:fncContSearch('하');return false;" style="font-weight:<%=schText.equals("하")?"bold":"" %>">하</a>
			</div>
		</td>
	</tr>
	<tr>
		<th>
			카테고리내 음식명
		</th>
		<td>
			<input type="text" name="schTrditfdNm" value="<%=request.getParameter("schTrditfdNm")==null?"":request.getParameter("schTrditfdNm")%>">
			<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
		</td>
	</tr>
<%
	}else{
%>
		<tr>
			<th>음식명</th>
			<td>
				<input type="text" name="schTrditfdNm2" value="<%=request.getParameter("schTrditfdNm2")==null?"":request.getParameter("schTrditfdNm2")%>">
				<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
			</td>
		</tr>
		<tr>
			<th>지역</th>
			<td>
				<select name="sidoCode">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="doLst";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;

						//서버와 통신
						URL sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						InputStream sub_apiStream = sub_apiUrl.openStream();

						Document sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						int sub_size = 0;

						NodeList sub_items = null;
						NodeList sub_codes = null;
						NodeList sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//지역코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//지역명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("sidoCode")!=null && request.getParameter("sidoCode").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    </td>

		</tr>
		<tr>
			<th>식품유형</th>
			<td>
				<select name="food_type_ctg01" onchange="javascript:fncTabChg('food_type_ctg01');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=112";
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("food_type_ctg01")!=null && request.getParameter("food_type_ctg01").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
				</select>&nbsp;&nbsp;
				<select name="food_type_ctg02" onchange="javascript:fncTabChg('food_type_ctg02');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=112";
						parameter += "&upperCode="+request.getParameter("food_type_ctg01");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("food_type_ctg02")!=null && request.getParameter("food_type_ctg02").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    &nbsp;&nbsp;
				<select name="food_type_ctg03" onchange="javascript:fncTabChg('food_type_ctg03');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=112";
						parameter += "&upperCode="+request.getParameter("food_type_ctg02");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("food_type_ctg03")!=null && request.getParameter("food_type_ctg03").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    &nbsp;&nbsp;
				<select name="food_type_ctg04" onchange="javascript:fncTabChg();">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=112";
						parameter += "&upperCode="+request.getParameter("food_type_ctg03");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("food_type_ctg04")!=null && request.getParameter("food_type_ctg04").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    </td>

		</tr>
		<tr>
			<th>식재료</th>
			<td>
				<select name="fd_mt_ctg01" onchange="javascript:fncTabChg('fd_mt_ctg01');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="fdMtLst";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("fd_mt_ctg01")!=null && request.getParameter("fd_mt_ctg01").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
				</select>&nbsp;&nbsp;
				<select name="fd_mt_ctg02" onchange="javascript:fncTabChg();">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="fdMtLst";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&code="+request.getParameter("fd_mt_ctg01");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("fd_mt_ctg02")!=null && request.getParameter("fd_mt_ctg02").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    </td>

		</tr>
				<tr>
			<th>조리법</th>
			<td>
				<select name="ck_ry_ctg01" onchange="javascript:fncTabChg('ck_ry_ctg01');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=115";
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("ck_ry_ctg01")!=null && request.getParameter("ck_ry_ctg01").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
				</select>&nbsp;&nbsp;
				<select name="ck_ry_ctg02" onchange="javascript:fncTabChg('ck_ry_ctg02');">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=115";
						parameter += "&upperCode="+request.getParameter("ck_ry_ctg01");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("ck_ry_ctg02")!=null && request.getParameter("ck_ry_ctg02").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    &nbsp;&nbsp;
				<select name="ck_ry_ctg03" onchange="javascript:fncTabChg();">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="cmmCodeInfo";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						parameter += "&codeGroup=115";
						parameter += "&upperCode="+request.getParameter("ck_ry_ctg02");
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("ck_ry_ctg03")!=null && request.getParameter("ck_ry_ctg03").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
		    </select>
		    </td>

		</tr>
		<tr>
			<th>테마</th>
			<td>
				<select name="tema_ctg01" onchange="javascript:fncTabChg();">
					<option value="">선택하세요</option>
<%					//과명 서브 리스트 출력
						//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
						apiKey="발급받은인증키를삽입하세요";
						//서비스 명
						serviceName="nvpcFdCkry";
						//오퍼레이션 명
						operationName="temaLst";

						//XML 받을 URL 생성
						parameter = "/"+serviceName+"/"+operationName;
						parameter += "?apiKey="+ apiKey;
						//서버와 통신
						sub_apiUrl = new URL("http://api.nongsaro.go.kr/service"+parameter);
						sub_apiStream = sub_apiUrl.openStream();

						sub_doc = null;
						try{
							//xml document
							sub_doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(sub_apiStream);
						}catch(Exception e){
							e.printStackTrace();
						}finally{
							sub_apiStream.close();
						}

						sub_size = 0;

						sub_items = null;
						sub_codes = null;
						sub_codeNms = null;

						sub_items = sub_doc.getElementsByTagName("item");
						sub_size = sub_doc.getElementsByTagName("item").getLength();
						sub_codes = sub_doc.getElementsByTagName("code");
						sub_codeNms = sub_doc.getElementsByTagName("codeNm");

						for(int i=0; i<sub_size; i++){
							//코드
							String sub_code = sub_codes.item(i).getFirstChild() == null ? "" : sub_codes.item(i).getFirstChild().getNodeValue();
							//코드명
							String sub_codeNm = sub_codeNms.item(i).getFirstChild() == null ? "" : sub_codeNms.item(i).getFirstChild().getNodeValue();
%>
					<option value="<%=sub_code%>" <%=request.getParameter("tema_ctg01")!=null && request.getParameter("tema_ctg01").equals(sub_code)?"selected":""%>><%=sub_codeNm%></option>
<%
						}
%>
				</select>
		    </td>

		</tr>
		<tr>
			<td colspan="2">
			정렬방식 :
			<select name="order" onchange="javascript:fncTabChg();">
			<option value="DESC" <%=request.getParameter("order")!=null && request.getParameter("order").equals("DESC")?"selected":""%>>내림차순</option>
			<option value="ASC" <%=request.getParameter("order")!=null && request.getParameter("order").equals("ASC")?"selected":""%>>오름차순</option>
			</select>
			출력건수 :
			<select name="numOfRows" onchange="javascript:fncTabChg();">
			<option value="10" <%=request.getParameter("numOfRows")!=null && request.getParameter("numOfRows").equals("10")?"selected":""%>>10</option>
			<option value="5" <%=request.getParameter("numOfRows")!=null && request.getParameter("numOfRows").equals("5")?"selected":""%>>5</option>
			</select>
			</td>
		</tr>

<%
	}
%>
	</tbody>
	</table>

	</form>

<%
	if(size==0){
%>
	<h3>조회한 정보가 없습니다.</h3>
<%
	}else{
%>
	<hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:25%;"/>
			<col/>
			<col style="width:25%;"/>
			<col style="width:10%;"/>
			<col style="width:10%;"/>
		</colgroup>
		<tr>
			<th>이미지</th>
			<th>음식명</th>
			<th>조리법</th>
			<th>IPC</th>
			<th>고문헌</th>
		</tr>
<%
		for(int i=0; i<size; i++){
			//이미지 첨부구분
			String rtnImgSeCode = rtnImgSeCodes.item(i).getFirstChild() == null ? "" : rtnImgSeCodes.item(i).getFirstChild().getNodeValue();
			//키
			String cntntsNo = cntntsNos.item(i).getFirstChild() == null ? "" : cntntsNos.item(i).getFirstChild().getNodeValue();
			//이미지 설명
			String rtnImageDc = rtnImageDcs.item(i).getFirstChild() == null ? "" : rtnImageDcs.item(i).getFirstChild().getNodeValue();
			//이미지 경로
			String rtnFileCours = rtnFileCourss.item(i).getFirstChild() == null ? "" : rtnFileCourss.item(i).getFirstChild().getNodeValue();
			//이미지 파일명
			String rtnThumbFileNm = rtnThumbFileNms.item(i).getFirstChild() == null ? "" : rtnThumbFileNms.item(i).getFirstChild().getNodeValue();
			//음식명
			String trditfdNm = trditfdNms.item(i).getFirstChild() == null ? "" : trditfdNms.item(i).getFirstChild().getNodeValue();
			//음식유형 풀경로
			String foodTyCodeFullname = foodTyCodeFullnames.item(i).getFirstChild() == null ? "" : foodTyCodeFullnames.item(i).getFirstChild().getNodeValue();
			//지역명
			String atptCodeNm = atptCodeNms.item(i).getFirstChild() == null ? "" : atptCodeNms.item(i).getFirstChild().getNodeValue();
			//조리법
			String ckryCodeFullname = ckryCodeFullnames.item(i).getFirstChild() == null ? "" : ckryCodeFullnames.item(i).getFirstChild().getNodeValue();
			//IPC
			String clIpcCode = clIpcCodes.item(i).getFirstChild() == null ? "" : clIpcCodes.item(i).getFirstChild().getNodeValue();
			//IPC명
			String clIpcCodeNm = clIpcCodeNms.item(i).getFirstChild() == null ? "" : clIpcCodeNms.item(i).getFirstChild().getNodeValue();
			//고문헌명
			String oldLtrtreNm = oldLtrtreNms.item(i).getFirstChild() == null ? "" : oldLtrtreNms.item(i).getFirstChild().getNodeValue();
			//고문헌코드
			String oldLtrtreEsntlCode = oldLtrtreEsntlCodes.item(i).getFirstChild() == null ? "" : oldLtrtreEsntlCodes.item(i).getFirstChild().getNodeValue();
		%>
		<tr>
		<%
			int imgCnt =-1;
			String[] rtnImgSeCodeArr= rtnImgSeCode.split("\\|");
			String[] rtnFileCoursArr = rtnFileCours.split("\\|");
			String[] rtnThumbFileNmArr = rtnThumbFileNm.split("\\|");
			for(int k=0; k < rtnImgSeCodeArr.length; k++){
				if("209006".equals(rtnImgSeCodeArr[k])){
					imgCnt = k;
				}
			}
			String imgUrl ="http://www.nongsaro.go.kr/ps/img/common/anvil_img.jpg";
			if(imgCnt > -1){
				imgUrl = "http://www.nongsaro.go.kr/"+ rtnFileCoursArr[imgCnt] +"/"+ rtnThumbFileNmArr[imgCnt];
			}else{
				for(int j=0; j < rtnImgSeCodeArr.length; j++){
					if("209007".equals(rtnImgSeCodeArr[j]) && imgCnt == -1){
						imgCnt = j;
					}
				}
				if(imgCnt > -1){
					imgUrl = "/"+ rtnFileCoursArr[imgCnt] +"/"+ rtnThumbFileNmArr[imgCnt];
				}
			}
			%>
			<td>
			<a href="#" onclick="javascript:fncView('<%=cntntsNo%>');">
			<img src="<%=imgUrl%>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</a>
			</td>
			<td align="center">
			<a href="#" onclick="javascript:fncView('<%=cntntsNo%>');">
			<%=trditfdNm%>
			<%
			if(foodTyCodeFullname != null  && !"".equals(foodTyCodeFullname)){
				out.print("["+foodTyCodeFullname+"]");
			}
			if(atptCodeNm != null  && !"".equals(atptCodeNm)){
				out.print("["+atptCodeNm+"]");
			}else{
				out.print("[상용]");
			}
			%>
			</a>
			</td>
			<td align="center"><%=ckryCodeFullname%></td>
			<td align="center">
			<%
			if(clIpcCode != null  && !"".equals(clIpcCode)){
				String[] clIpcCodeArr= clIpcCode.split(", ");
				String[] clIpcCodeNmArr=clIpcCodeNm.split(",");
				for(int l=0;l<clIpcCodeArr.length;l++){
				if(l != 0){out.print(",");}
			%>
				<a href="#" onclick="fncListOpen('1','<%=clIpcCodeArr[l]%>','<%=clIpcCodeNmArr[l]%>')"><%=clIpcCodeNmArr[l]%></a>
			<%
				}
			}
			%>
			</td>
			<td align="center">
			<%
			if(oldLtrtreEsntlCode != null  && !"".equals(oldLtrtreEsntlCode)){
				String[] oldLtrtreEsntlCodeArr= oldLtrtreEsntlCode.split(", ");
				String[] oldLtrtreNmArr=oldLtrtreNm.split(",");
				for(int m=0;m<oldLtrtreEsntlCodeArr.length;m++){
				if(m != 0){out.print(",");}
			%>
				<a href="#" onclick="fncListOpen('2','<%=oldLtrtreEsntlCodeArr[m]%>','')"><%=oldLtrtreNmArr[m]%></a>
			<%
				}
			}
			%>
			</td>
		</tr>
<%
		}
%>
	</table>
<%
	}
//페이징 처리
	//한 페이지에 제공할 건수
	String numOfRows = "";
	//조회된 총 건수
	String totalCount = "";
	//조회할 페이지 번호
	String pageNo = "";
	try{numOfRows = doc.getElementsByTagName("numOfRows").item(0).getFirstChild().getNodeValue();}catch(Exception e){numOfRows = "";}
	try{totalCount = doc.getElementsByTagName("totalCount").item(0).getFirstChild().getNodeValue();}catch(Exception e){totalCount = "";}
	try{pageNo = doc.getElementsByTagName("pageNo").item(0).getFirstChild().getNodeValue();}catch(Exception e){pageNo = "";}

	int pageGroupSize = 10;
	int pageSize = 0;
	try{
		pageSize = Integer.parseInt(numOfRows);
	}catch(Exception e){
		pageSize = 10;
	}
	int start = 0;
	try{
		start = Integer.parseInt(pageNo);
	}catch(Exception e){
		start = 1;
	}


	int currentPage = 1;
	try{currentPage = Integer.parseInt(pageNo);}catch(Exception e){}

	int startRow = (currentPage - 1) * pageSize + 1;//한 페이지의 시작글 번호
	int endRow = currentPage * pageSize;//한 페이지의 마지막 글번호
	int count = Integer.parseInt( totalCount);
	int number=0;


	number=count-(currentPage-1)*pageSize;//글목록에 표시할 글번호

	//페이지그룹의 갯수
	//ex) pageGroupSize가 3일 경우 '[1][2][3]'가 pageGroupCount 개 만큼 있다.
	int pageGroupCount = count/(pageSize*pageGroupSize)+( count % (pageSize*pageGroupSize) == 0 ? 0 : 1);
	//페이지 그룹 번호
	//ex) pageGroupSize가 3일 경우  '[1][2][3]'의 페이지그룹번호는 1 이고  '[2][3][4]'의 페이지그룹번호는 2 이다.
	int numPageGroup = (int) Math.ceil((double)currentPage/pageGroupSize);


	if(count > 0){
		int pageCount = count / pageSize + ( count % pageSize == 0 ? 0 : 1);
		int startPage = pageGroupSize*(numPageGroup-1)+1;
		int endPage = startPage + pageGroupSize-1;
		int prtPageNo = 0;

		if(endPage > pageCount){
			endPage = pageCount;
		}

		if(numPageGroup > 1){
			prtPageNo = (numPageGroup-2)*pageGroupSize+1;
			out.println("<a href='javascript:fncGoPage("+prtPageNo+");'>[이전]</a>");
		}

		for(int i=startPage; i<=endPage; i++){
			prtPageNo = i;
			out.print("<a href='javascript:fncGoPage("+prtPageNo+");'>");
			if(currentPage == i){
				out.print("<strong>["+i+"]</strong>");
			}else{
				out.print("["+i+"]");
			}
			out.println("</a>");
		}

		if(numPageGroup < pageGroupCount){
			prtPageNo = (numPageGroup*pageGroupSize+1);
			out.println("<a href='javascript:fncGoPage("+prtPageNo+");'>[다음]</a>");
		}
	}
//페이징 처리 끝
}
%>
<br>
</body>
</html>